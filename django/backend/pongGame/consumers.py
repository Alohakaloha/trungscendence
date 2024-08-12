from channels.generic.websocket import AsyncWebsocketConsumer
from .localTournament import tournamentHandler as tH
from asgiref.sync import sync_to_async
from django.utils import timezone
from . import pong
import json
import asyncio
import sys
from channels.layers import get_channel_layer
import copy

def registerScore(data):
	from .models import LocalMatch

	table = {
		'type' : data.get('type'),
		'player_1' : data.get('player_1_name'),
		'player_2' : data.get('player_2_name'),
		'rounds_player_1' : data.get('player1_rounds'),
		'rounds_player_2' : data.get('player2_rounds'),
		'winner' : data.get('winner'),
	}


	try:
		local_match = LocalMatch.objects.create(**table)
		return local_match
	except Exception as e:
		logprint(e)
		raise e

#map users to the lobby 
# class multimap:
# 	def __init__(self):
# 		self.map = {}

# 	def add(self, key, value):
# 		if key not in self.map:
# 			self.map[key] = []
# 		self.map[key].append(value)

# 	def remove(self, key, value=None):
# 		if key in self.map:
# 			if value is None:
# 				del self.map[key]
# 		elif value in self.map[key]:
# 			self.map[key].remove(value)
# 			if not self.map[key]:
# 				del self.map[key]

# 	def lobby_exist(self, id):
# 		for item in self.map.values():
# 			if isinstance(item, list):
# 				for sub_item in item:
# 					if isinstance(sub_item, dict) and 'lobby' in sub_item:
# 						if sub_item['lobby'] == id:
# 							return True
# 		return False


# 	def find_lobby(self, user_id):
# 		for item in self.get(user_id):
# 			if isinstance(item, dict) and 'lobby' in item:
# 				return item['lobby']
# 		return None

# 	def remove_all(self, key):
# 		if key in self.map:
# 			del self.map[key]


# 	def get(self, key):
# 		return self.map.get(key, [])

# 	def get_all(self):
# 		return self.map

# 	def print_multimap(self):
# 		for key, values in self.map.items():
# 			logprint(f"{key}: {values}")


def logprint(*args, **kwargs):
	print(*args, file=sys.stderr, **kwargs)

# user_mapping = multimap()
active_rooms = {}


# def find_channel(lobby_id):
# 	user_channels = {}
# 	if lobby_id in active_rooms:
# 		users_in_lobby = active_rooms[lobby_id][0]  # Get the list of user IDs in the lobby

# 		for user_id in users_in_lobby:
# 			user_details = user_mapping.get(user_id)
# 			if user_details:
# 				for detail in user_details:
# 					if 'channel' in detail:
# 						user_channels[user_id] = detail['channel']
# 						break  # Assuming each user has only one channel
# 	return user_channels


# def generate_random_string(length=5):
# 	letters = string.ascii_lowercase
# 	return ''.join(random.choice(letters) for i in range(length))

class localPongGameConsumer(AsyncWebsocketConsumer):
	async def connect(self):

		self.room_name = pong.randomCode()
		self.room_group_name = "game_"+ self.room_name

		self.connections = 0

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		# player_class
		self.player = pong.Player()

		# change this for testing purposes
		if (self.connections < 1):
			await self.accept()
			self.connections += 1
		else:
			return

		self.fps = 1/60
		self.game_active = True
		self.next_round = False
		self.gaming = asyncio.create_task(self.game_loop())

	async def game_loop(self):
		while self.game_active:
			if self.connections < 1:
				self.game_active = False
				self.gaming.cancel()
				return
			if self.player.ball.collision(self.player):
				if self.player.ball.speed < 1.2:
					# change back to 0.03 after testing
					self.player.ball.speed += 1
				self.player.ball.direction_x = -self.player.ball.direction_x
				await self.send(json.dumps(self.player.Player_Sound()))
			if self.player.ball.wall_collision():
				await self.send(json.dumps(self.player.Wall_Sound()))
			if not self.player.ball.boundaries():
				self.player.score.scoring(self.player.gamePos())
				self.player.score.next_round()
				self.player.ball.reset_ball()
				await self.send(json.dumps(self.player.status()))
			if self.player.score.game_end():
				self.game_active = False
				final_score_data = self.player.score.final_score()
				await self.send(json.dumps(final_score_data))
				await sync_to_async(registerScore)(final_score_data)
				self.gaming.cancel()
				await self.disconnect()
			await asyncio.sleep(self.fps)


	async def disconnect(self, close_code):

		self.connections -= 1
		self.game_active = False
		self.gaming.cancel()
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

	async def receive(self, text_data):
		try:
			commands = json.loads(text_data)
			if not isinstance(commands, list):
				commands = [commands]
			for action in commands:
				if not isinstance(action, dict):
					# Convert action to a dictionary if it's not already
					action = json.loads(action)  
				if "pause" in action:
					self.game_active = False
					self.gaming.cancel()
					return
				elif "resume" in action:
					if not self.game_active:
						self.game_active = True
						self.gaming = asyncio.create_task(self.game_loop())
				elif "settings" in action:
					self.player.score.settings(action)
					await self.send(json.dumps(self.player.score.current_rules()))
				elif "movement" in action:
					self.player.move(action)
					await self.send(json.dumps(self.player.gamePos()))
				elif "update" in action:
					await self.send(json.dumps(self.player.gamePos()))
				elif "status" in action:
					await self.send(json.dumps(self.player.score.current_rules()))
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data}")

class localTournament(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name =  pong.randomCode()
		self.room_group_name = "lt_"+ self.room_name
		self.status = "idle"

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		self.tournament = tH()
		await self.accept()


	async def receive(self, text_data):
		data = json.loads(text_data)
		if "type" in data:
			if data["type"] == "settings":
				self.tournament.setRules(data)
				await self.send(json.dumps(self.tournament.currentRules()))
			elif data["type"] == "status":
				if self.tournament.th_status == "finished":
					await self.send(json.dumps(self.tournament.tournamentResults()))
					await self.disconnect()
					return
				await self.send(json.dumps(self.tournament.tournamentStatus()))

			elif data["type"] == 'match_result':
				self.tournament.saveMatch(data)
				self.tournament.setReady()
				self.tournament.nextMatch()
				if self.tournament.th_status == "finished":
					await self.send(self.tournament.tournamentResults())
				else:
					await self.send(json.dumps(self.tournament.currentRules()))
		if "request" in data:
			if data["request"] == "url":
				await self.send(json.dumps({"url": "/game/localTournament.html"}))



	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)


class localTournamentMatch(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name = pong.randomCode()
		self.room_group_name = "game_"+ self.room_name

		self.connections = 0

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		# player_class
		self.player = pong.Player()

		# change this for testing purposes
		if (self.connections < 1):
			await self.accept()
			self.connections += 1
		else:
			return
		# around 30 fps
		self.fps = 0.02
		self.game_active = True
		self.gaming = asyncio.create_task(self.game_loop())

	async def game_loop(self):
		while self.game_active:
			if self.connections < 1:
				self.game_active = False
				self.gaming.cancel()
				return
			if self.player.ball.collision(self.player):
				if self.player.ball.speed < 1.2:
					# change back to 0.03 after testing
					self.player.ball.speed += 0.03
				self.player.ball.direction_x = -self.player.ball.direction_x
				await self.send(json.dumps(self.player.Player_Sound()))
			if self.player.ball.wall_collision():
				await self.send(json.dumps(self.player.Wall_Sound()))
			if not self.player.ball.boundaries():
				self.player.score.scoring(self.player.gamePos())
				self.player.score.next_round()
				self.player.ball.reset_ball()
				await self.send(json.dumps(self.player.status()))
			if self.player.score.game_end():
				self.game_active = False
				self.gaming.cancel()
				await self.send(json.dumps(self.player.score.final_score()))
				return
			await asyncio.sleep(self.fps)

	async def disconnect(self, close_code):
		self.connections -= 1
		self.game_active = False
		self.gaming.cancel()
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
	
	async def receive(self, text_data):
		try:
			commands = json.loads(text_data)
			if "type" in commands:
				self.player.score.settings(commands)
				await self.send(json.dumps(self.player.score.current_rules()))

			if not isinstance(commands, list):
				commands = [commands]
			for action in commands:
				if not isinstance(action, dict):
					# Convert action to a dictionary if it's not already
					action = json.loads(action)  
				if "pause" in action:
					self.game_active = False
					self.gaming.cancel()
					return
				elif "resume" in action:
					if not self.game_active:
						self.game_active = True
						self.gaming = asyncio.create_task(self.game_loop())
				elif "movement" in action:
					self.player.move(action)
				elif "update" in action:
					await self.send(json.dumps(self.player.gamePos()))
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data} 2")


class remote_lobby(AsyncWebsocketConsumer):
	async def connect(self, ):
		from auth_app.models import AppUser as App
		self.lobby = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = self.lobby
		await self.accept()
		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)


	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

		if self.lobby in active_rooms:
			if self.scope["user"].username in active_rooms[self.lobby]['users']:
				active_rooms[self.lobby]['users'].remove(self.scope["user"].username)
			if len(active_rooms[self.lobby]['users']) == 0:
				del active_rooms[self.lobby]
		await self.close(close_code)

	async def receive(self, text_data):
		try:
			data = json.loads(text_data)
			if data["request"] == "created":
				if self.lobby not in active_rooms:
					active_rooms[self.lobby] = {'users': [data["user"]], 'num_active': 0}
					await self.send(json.dumps({"url": "/match/lobby"}))
				else:
					await self.send(json.dumps({"type": "toast", "message": "Room already exists"}))
					await self.channel_layer.group_discard(
						self.room_group_name,
						self.channel_name
						)
					await self.disconnect(close_code=1000)
			if data["request"] == "join":
				if self.lobby in active_rooms:
					if len(active_rooms[self.lobby]['users']) < 2:
						active_rooms[self.lobby]['users'].append(data["user"])
						await self.send(json.dumps({"url": "/match/lobby"}))
						await self.channel_layer.group_send(self.room_group_name, {
							"type": "chat_message",
							"user": data["user"],
							"message": f"{data['user']} has joined"
						})
					else:
						await self.send(json.dumps({"type": "toast", "message": "Cannot join room"}))
						await self.channel_layer.group_discard(
							self.room_group_name,
							self.channel_name
							)
						await self.disconnect(close_code=1000)
				else:
					await self.send(json.dumps({"type": "toast", "message": "Room does not exist"}))
					await self.disconnect(close_code=1000)
					logprint("Room does not exist")
			
			if data["request"] == "url":
				logprint("url requested")
				await self.send(json.dumps({"url": "/match/lobby"}))
			elif data["request"] == "status":
				if data["status"] == "ready":
					logprint(f"User {self.scope['user'].username} is ready")
					await self.channel_layer.group_send(self.room_group_name, {
						"type": "chat_message",
						"user": self.scope["user"].username,
						"message": f"{self.scope['user'].username} is ready"
					})
					active_rooms[self.lobby]['num_active'] += 1
					#await self.send(json.dumps({"status": "ready", "user": self.scope["user"].username}))
			elif data["request"] == "created":
				active_rooms[self.lobby]['rules'] = data['settings']
			
			elif data["request"] == "invite":
				await self.send(json.dumps({self.lobby}))

			elif data["request"] == "save":
				#todo save game here
				logprint("Game saved")		
				if self.lobby in active_rooms:
					if self.scope["user"].username in active_rooms[self.lobby]['users']:
						active_rooms[self.lobby]['users'].remove(self.scope["user"].username)
						logprint(active_rooms[self.lobby])
					if len(active_rooms[self.lobby]['users']) == 0:
						del active_rooms[self.lobby]
					await self.disconnect(close_code=1000)

			if self.lobby in active_rooms:	
				if active_rooms[self.lobby]['num_active'] == 2:
					# Start the game (sending message)
					channel_layer = get_channel_layer()
					await channel_layer.group_send(self.room_group_name, {
						"type": "chat.match",
					})
			
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data} 3")

	async def chat_message(self, event):
		logprint(f'{event}')
		user = event["user"]
		await self.send(text_data=json.dumps({
		"type": "toast",
		"status" : "joined",
		"user" :  user,
		"message" : event['message'],
		}))

	async def chat_match(self, event):
		await self.send(text_data=json.dumps({
		"type": "toast",
		"status" : "playing",
		"message" : "FIGHT!!!",
		}))

	async def match_start(self, event):
		pass

	async def game_xy(self, event):
		pass

	async def end_game(self, event):
		pass



class remote_match(AsyncWebsocketConsumer):
	async def connect(self):
		# player_class
		logprint("connected")
		self.lobby = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = self.lobby

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		self.fps = 0.02
		await self.accept()

		# TODO: figure out dictionary key for rounds and score
		data = {
		"player1": active_rooms[self.lobby]['users'][0],
		"player2": active_rooms[self.lobby]['users'][1],
		"rounds": active_rooms[self.lobby]['rules']['rounds'],
		"score": active_rooms[self.lobby]['rules']['score'],
		}

		if 'game' not in active_rooms[self.lobby]:
			active_rooms[self.lobby]['game'] = pong.Player()

			if active_rooms[self.lobby]['game'].score.set == False:
				active_rooms[self.lobby]['game'].score.settings(data)

		# 	if len(active_rooms[self.lobby]['users']) < 2:
		# 		self.game_resource[self.lobby].append(int(1))
		# else:
		# 	if len(active_rooms[self.lobby]['users']) < 2:
		# 		self.game_resource[self.lobby].append(int(1))
		# 		self.game_resource[self.lobby][1] += 1
		# 	else:
		# 		self.game_resource[self.lobby][1] += 1

		if active_rooms[self.lobby]['num_active'] == 2:
			active_rooms[self.lobby]['loop'] = asyncio.create_task(self.game_loop())
			active_rooms[self.lobby]['ongoing'] = True

	# 0 - 'game'
	# 1 - 'num_active'
	# 2 - 'loop'
	# 3 - 'ongoing'
	# 4 - 'users'
	# 5 - 'rules'

	async def game_loop(self):
		while active_rooms[self.lobby]['ongoing']:
			if active_rooms[self.lobby]['num_active'] != 2:
				# TODO: quit game
				pass
			if active_rooms[self.lobby]['game'].ball.collision(active_rooms[self.lobby]['game']):
				if active_rooms[self.lobby]['game'].ball.speed < 1.2:
					# change back to 0.03 after testing
					active_rooms[self.lobby]['game'].ball.speed += 0.03
				active_rooms[self.lobby]['game'].ball.direction_x = -active_rooms[self.lobby]['game'].ball.direction_x
				await self.send(json.dumps(active_rooms[self.lobby]['game'].Player_Sound()))
			if active_rooms[self.lobby]['game'].ball.wall_collision():
				await self.send(json.dumps(active_rooms[self.lobby]['game'].Wall_Sound()))
			if not active_rooms[self.lobby]['game'].ball.boundaries():
				active_rooms[self.lobby]['game'].score.scoring(active_rooms[self.lobby]['game'].gamePos())
				active_rooms[self.lobby]['game'].score.next_round()
				active_rooms[self.lobby]['game'].ball.reset_ball()
				await self.send(json.dumps(active_rooms[self.lobby]['game'].status()))
			if active_rooms[self.lobby]['game'].score.game_end():
				game_task = active_rooms[self.lobby]['game']
				logprint("game_end")
				active_rooms[self.lobby]['ongoing'] = False
				channel_layer = get_channel_layer()
				await channel_layer.group_send(self.room_group_name,{
						"type": "end.game",
						"request": "end",
						"score": active_rooms[self.lobby]['game'].score.final_score(),
					})
				return
			await asyncio.sleep(self.fps)

	async def disconnect(self, close_code):
		if self.lobby in active_rooms:
			active_rooms[self.lobby]['num_active'] -= 1
			if active_rooms[self.lobby]['num_active'] == 0:
				del active_rooms[self.lobby]

		await self.channel_layer.group_discard(
			self.lobby,
			self.channel_name
		)

	async def receive(self, text_data):
		try:
			action = json.loads(text_data) 

			if "settings" in action:
				active_rooms[self.lobby]['game'].score.settings(action)
				await self.send(json.dumps(active_rooms[self.lobby]['game'].score.current_rules()))
			elif "movement" in action:
				active_rooms[self.lobby]['game'].remote_move(action)
				await self.send(json.dumps(active_rooms[self.lobby]['game'].gamePos()))
			elif "update" in action:
				channel_layer = get_channel_layer()
				if self.lobby in active_rooms:
					await channel_layer.group_send(self.room_group_name,{
							"type": "game.xy",
							"request": "update",
							"score": active_rooms[self.lobby]['game'].gamePos(),
						})

			elif "status" in action:
				await self.send(json.dumps(active_rooms[self.lobby]['game'].score.current_rules()))
			elif "type" in action:
				if action["type"] == "start":
					channel_layer = get_channel_layer()
					await channel_layer.group_send(self.room_group_name, {
						"type": "match.start",
						"message": "Match is starting",
						"request": "start"
					})
			return


		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data}")

	async def match_start(self, event):
		logprint("inside match_start")
		logprint(f'{event}')
		message = event["message"]
		request = event["request"]

		await self.send(json.dumps({
		"type": "start",
		"request": request,
		"message": message
		}))
		logprint("sent message ---------------")

	async def game_xy(self, event):
		await self.send(json.dumps({
		"type": "coordinates",
		"coordinates": event['score']
		}))

	async def end_game(self, event):
		await self.send(json.dumps({
		"type": "end",
		"request": "end",
		"score": event["score"]
		}))

	async def chat_match(self, event):
		pass
