import requests
import pandas as pd
import json
import os
import sys

# set below to your TeamID
team_id = 4545
# set below to available or active
wildcard = 'available'

def get_player_data():
    r = requests.get('https://fantasy.premierleague.com/api/bootstrap-static/')
    fpl_data = r.json()
    player_data = pd.DataFrame(fpl_data['elements'], columns=['id', 'now_cost', 'cost_change_start'])
    event_data = pd.DataFrame(fpl_data['events'], columns=['id', 'is_current'])

    return player_data, event_data

def get_picks_data(team_id, gw):
    r = requests.get(f'https://fantasy.premierleague.com/api/entry/{team_id}/event/{gw}/picks/')
    fpl_data = r.json()
    picks_data = pd.DataFrame(fpl_data['picks'])  
    if (fpl_data['entry_history']['event'] == 1 or fpl_data['active_chip'] == 'freehit' or fpl_data['active_chip'] == 'wildcard' or fpl_data['entry_history']['event_transfers'] >= 1):
          limit = 1
    else:
        limit = 2
    team_dict = {'cost': 4, 'status': 'cost', 'limit': limit, 'made': 0, 'bank': fpl_data['entry_history']['bank'], 'value': fpl_data['entry_history']['value']}    

    return picks_data, team_dict

def get_chips_data(team_id):
    r = requests.get(f'https://fantasy.premierleague.com/api/entry/{team_id}/history/')
    fpl_data = r.json()
    chips_data = pd.DataFrame(fpl_data['chips'])

    return chips_data

def get_transfers_data(team_id):
    r = requests.get(f'https://fantasy.premierleague.com/api/entry/{team_id}/transfers/')
    fpl_data = r.json()
    transfer_data = pd.DataFrame(fpl_data) 

    return transfer_data

picks, team = get_picks_data(team_id, 1)
players, events = get_player_data()
transfers = get_transfers_data(team_id)

merged_data = picks.merge(players, how='left', left_on='element', right_on='id')
merged_data.insert(loc=2, column='selling_price', value=0)
merged_data.insert(loc=4, column='purchase_price', value=0)
del merged_data['id']

events = events.loc[events['is_current'] == 1]
gameweek = events.iloc[0]['id']

weeks_ignore = []
if (gameweek > 1):    
    history = get_chips_data(team_id)
    for ind in history.index:
        if (history[ind, 'name'] == 'freehit'):
            weeks_ignore.append(history[ind, 'event'])

for ind in merged_data.index:
    merged_data.at[ind, 'selling_price'] = merged_data.at[ind, 'now_cost'] - merged_data.at[ind, 'cost_change_start']
    merged_data.at[ind, 'purchase_price'] = merged_data.at[ind, 'now_cost'] - merged_data.at[ind, 'cost_change_start']
    if len(transfers.index) != 0:
        for ind2 in transfers.index:
            if (transfers.at[ind2, 'event'] not in weeks_ignore):
                pricediff = merged_data.at[ind, 'now_cost'] - transfers.at[ind2, 'element_in_cost']
                if (pricediff > 2):
                    if (pricediff % 2) == 0:
                        pricediff = merged_data.at[ind, 'now_cost'] - transfers.at[ind2, 'element_in_cost']
                    else:
                        pricediff = merged_data.at[ind, 'now_cost'] - transfers.at[ind2, 'element_in_cost'] - 1
                else:
                    pricediff = 0
                merged_data.at[ind, 'selling_price'] = transfers.at[ind2, 'element_in_cost'] + pricediff
                break

#Get team value and update dict
team_value = merged_data['now_cost'].sum()
team.update({'value':int(team_value)})

del merged_data['now_cost']
del merged_data['cost_change_start']
merged_dict = merged_data.to_dict(orient = 'records')

chips_pd = pd.DataFrame()
if (wildcard == 'available'):
    chips_pd.insert(0, 'status_for_entry', ['available'])
    chips_pd.insert(1, 'name', ['wildcard'])
else:
    chips_pd.insert(0, 'status_for_entry', ['active'])
    chips_pd.insert(1, 'name', ['wildcard'])

chips_dict = chips_pd.to_dict(orient = 'records')

#create json file
with open(os.path.join(sys.path[0],'team.json'), 'w') as f:
    json.dump({'picks' : merged_dict, 'chips': chips_dict, 'transfers' : team}, f)
