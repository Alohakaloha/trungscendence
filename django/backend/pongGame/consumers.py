from channels.generic.websocket import AsyncWebsocketConsumer
from .localTournament import tournamentHandler as tH
from asgiref.sync import sync_to_async
from django.utils import timezone
from . import pong
import json
import asyncio
import sys

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
class multimap:
	def __init__(self):
		self.map = {}

	def add(self, key, value):
		if key not in self.map:
			self.map[key] = []
		self.map[key].append(value)

	def remove(self, key, value=None):
		if key in self.map:
			if value is None:
				del self.map[key]
		elif value in self.map[key]:
			self.map[key].remove(value)
			if not self.map[key]:
				del self.map[key]

	def lobby_exist(self, id):
		for item in self.map.values():
			if isinstance(item, list):
				for sub_item in item:
					if isinstance(sub_item, dict) and 'lobby' in sub_item:
						if sub_item['lobby'] == id:
							return True
		return False


	def find_lobby(self, user_id):
		for item in self.get(user_id):
			if isinstance(item, dict) and 'lobby' in item:
				return item['lobby']
		return None

	def remove_all(self, key):
		if key in self.map:
			del self.map[key]


	def get(self, key):
		return self.map.get(key, [])

	def get_all(self):
		return self.map

	def print_multimap(self):
		for key, values in self.map.items():
			logprint(f"{key}: {values}")


def logprint(*args, **kwargs):
	print(*args, file=sys.stderr, **kwargs)

user_mapping = multimap()
active_rooms = dict()


def find_channel(lobby_id):
	user_channels = {}
	if lobby_id in active_rooms:
		users_in_lobby = active_rooms[lobby_id][0]  # Get the list of user IDs in the lobby

		for user_id in users_in_lobby:
			user_details = user_mapping.get(user_id)
			if user_details:
				for detail in user_details:
					if 'channel' in detail:
						user_channels[user_id] = detail['channel']
						break  # Assuming each user has only one channel
	return user_channels


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
		logprint(data)
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


class remote_match(AsyncWebsocketConsumer):


	async def connect(self):
		from auth_app.models import AppUser as App
		self.request_uname = self.scope['url_route']['kwargs']['room_name']
		self.request = await sync_to_async(App.objects.get)(username=self.request_uname)
		self.room_group_name = str(self.request.user_id)
		await self.accept()
		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		user_mapping.add(self.scope["user"].user_id, {"channel":self.channel_name})

	async def disconnect(self, close_code):
		user_id = self.scope["user"].user_id
		user_lobbies = user_mapping.get(user_id)
		for entry in user_lobbies:
			if 'lobby' in entry:
				lobby_id = entry['lobby']
				logprint(f"Found lobby: {lobby_id}")
		logprint("disconnect in remote")
		if lobby_id in active_rooms:
			if user_id in active_rooms[lobby_id][0]:
				active_rooms[lobby_id][0].remove(user_id)
			else:
				logprint(f"User {user_id} not in active_rooms[{lobby_id}][0]")
		if len(active_rooms[lobby_id][0]) == 0:
			active_rooms.pop(lobby_id)
			logprint("Lobby removed")
		user_mapping.remove(self.scope["user"].user_id)
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

	async def receive(self, text_data):
		try:
			data = json.loads(text_data)
			if data["request"] == "created":
				lobby_id = str(data["lobby"])
				if active_rooms.get(lobby_id) is None:
					active_rooms[lobby_id] = [[self.scope["user"].user_id], 0,0] 
					logprint(active_rooms[lobby_id])
					user_mapping.add(self.scope["user"].user_id, {"lobby": lobby_id})
					user_mapping.add(self.scope["user"].user_id, {"status": "idle"})
					logprint(user_mapping.get(self.scope["user"].user_id))
					await self.send(json.dumps({"type": "lobby","message":"created", "lobby_id" : lobby_id, "players": active_rooms[lobby_id][0]}))
				else:
					logprint("lobby already exists")
					await self.disconnect(close_code=1000)
					return
			elif data["request"] == "join":
				lobby_id = str(data["lobby"])
				if lobby_id is None:
					logprint("Room does not exist")
					user_mapping.remove(self.scope["user"].user_id)
					await self.disconnect(close_code=1000)
					return
				if (lobby_id in active_rooms):
					if len(active_rooms[lobby_id][0]) < 2:
						active_rooms[lobby_id][0].append(self.scope["user"].user_id)
						if isinstance(active_rooms[lobby_id][1], int):
							active_rooms[lobby_id][1] += 1
						user_mapping.add(self.scope["user"].user_id, {"lobby": lobby_id})
						user_mapping.add(self.scope["user"].user_id, {"status": "idle"})
						logprint(user_mapping.get_all())
						await self.send(json.dumps({"type": "info","lobby_id":lobby_id,"message": "joined the lobby"}))
				else:
					await self.send(json.dumps({"type": "info","message": "Can not join this lobby"}))
					await self.disconnect(close_code=1000)
			elif data["request"] == "url":
				logprint("url requested")
				await self.send(json.dumps({"url": "/match/lobby"}))
			elif data["request"] == "status":
				if data["status"] == "ready":
					user_details = user_mapping.get(self.scope["user"].user_id)
					if user_details:
						for detail in user_details:
							logprint(detail)
							if 'status' in detail:
								logprint(user_details)
								detail["status"] = "ready"
								logprint(user_mapping.get(self.scope["user"].user_id))
							if 'lobby' in detail:
								receiver = find_channel(detail["lobby"])
								for _, channel_name in receiver.items():
									logprint(channel_name)
									await self.channel_layer.send(channel_name, {
									"type": "chat.message",
								})
					await self.send(json.dumps({"status": "ready"}))
			elif data["request"] == "announcement":
				await self.send(json.dumps({"type":"info", "message": "a player is ready" }))
				# user_mapping.print_multimap()
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data} 3")

	async def chat_message(self, event):
		message = event["message"]
		user = event["user"]
		await self.send(text_data=json.dumps({
		"info": "toast",
		"status" : "ready",
		"message": message,
		"user" :  user
		}))