from channels.generic.websocket import AsyncWebsocketConsumer
from .localTournament import tournamentHandler as tH
from asgiref.sync import sync_to_async
from . import pong
import json
import asyncio
import sys


#map users to the lobby 
class multimap:
	def __init__(self):
		self.map = {}

	def add(self, key, value):
		if key not in self.map:
			self.map[key] = []
		self.map[key].append(value)

	def remove(self, key, value):
		if key in self.map:
			if value in self._map[key]:
				self.map[key].remove(value)
				if not self.map[key]:
					del self.map[key]

	def get(self, key):
		return self._map.get(key, [])

	def get_all(self):
		return self.map

	def print_multimap(self):
		for key, values in self.map.items():
			logprint(f"{key}: {values}")

def logprint(*args, **kwargs):
	print(*args, file=sys.stderr, **kwargs)

active_rooms = multimap()

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
				self.gaming.cancel()
				await self.send(json.dumps(self.player.score.final_score()))
				self.disconnect()
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
		if data["type"] == "settings":
			self.tournament.setRules(data)
			await self.send(json.dumps(self.tournament.currentRules()))
		elif data["type"] == "status":
			if self.tournament.th_status == "finished":
				logprint("winner found")
				await self.send(json.dumps(self.tournament.tournamentResults()))
				await self.disconnect()
				return
			await self.send(json.dumps(self.tournament.tournamentStatus()))

		elif data["type"] == 'match_result':
			self.tournament.saveMatch(data)
			self.tournament.setReady()
			self.tournament.nextMatch()
			await self.send(json.dumps(self.tournament.currentRules()))



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
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.players = []
		self.connections = 0

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
		active_rooms.add(self.scope["user"].user_id, self.channel_name)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
		active_rooms.remove(self.scope["user"].user_id)

	async def receive(self, text_data):
		try:
			data = json.loads(text_data)
			if data["request"] == "created":
				self.players = []
				self.host = str(self.scope["user"].user_id)
				self.players.append(str(self.scope["user"].user_id))
				self.connections + 1
				await self.send(json.dumps({"type": "lobby","owner":str(self.scope["user"].username)}))
			elif data["request"] == "join":
				lobby_id = data["lobby"]
				if lobby_id is None:
					self.disconnect()
					return
				self.players.append(str(self.scope["user"].user_id))
				self.connections + 1
				active_rooms.add(self.scope["user"].user_id, lobby_id)
				active_rooms.print_multimap()
				await self.send(json.dumps({"type": "lobby","client":str(self.scope["user"].username)}))
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data} 3")