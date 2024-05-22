from channels.generic.websocket import AsyncWebsocketConsumer
from .localTournament import tournamentHandler as tH
import json
import asyncio
from . import pong
import sys

active_rooms = set()

def logprint(*args, **kwargs):		
	print(*args, file=sys.stderr, **kwargs)


class localPongGameConsumer(AsyncWebsocketConsumer):
	async def connect(self):

		self.room_name = pong.randomCode()
		self.room_group_name = "game_"+ self.room_name
		active_rooms.add(self.room_group_name)

		self.connections = 0
		logprint("Room name: \n", self.room_name, "\nRoom group name: \n", self.room_group_name, "\n")

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
					self.player.ball.speed += 0.03
				self.player.ball.direction_x = -self.player.ball.direction_x
				self.send(self.player.clangSound())
			if not self.player.ball.move_ball():
				self.player.score.scoring(self.player.gamePos())
				self.player.score.next_round()
				self.player.ball.reset_ball()
				self.send(self.player.scoreSound())
				await self.send(json.dumps(self.player.score.current_rules()))
			if self.player.score.game_end():
				self.game_active = False
				self.gaming.cancel()
				logprint("Game ended")
				await self.send(json.dumps(self.player.score.final_score()))
				return
			await self.send(json.dumps(self.player.gamePos()))
			await asyncio.sleep(self.fps)


	async def disconnect(self, close_code):

		self.connections -= 1
		self.game_active = False
		self.gaming.cancel()
		active_rooms.remove(self.room_group_name)
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
				if "settings" in action:
					self.player.score.settings(action)
					await self.send(json.dumps(self.player.score.current_rules()))
				elif "movement" in action:
					self.player.move(action)
				elif "update" in action:
					await self.send(json.dumps(self.player.gamePos()))
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data}")



class localTournament(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_name =  pong.randomCode()
		self.room_group_name = "lt_"+ self.room_name

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

		if data["type"] == "status":
			await self.send(json.dumps(self.tournament.tournamentStatus()))


	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)


class localTournamentMatch(AsyncWebsocketConsumer):
	async def connect(self):

		self.room_name = pong.randomCode()
		self.room_group_name = "game_"+ self.room_name
		active_rooms.add(self.room_group_name)

		self.connections = 0
		logprint("Room name: \n", self.room_name, "\nRoom group name: \n", self.room_group_name, "\n")

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
					self.player.ball.speed += 0.03
				self.player.ball.direction_x = -self.player.ball.direction_x
				self.send(self.player.clangSound())
			if not self.player.ball.move_ball():
				self.player.score.scoring(self.player.gamePos())
				self.player.score.next_round()
				self.player.ball.reset_ball()
				self.send(self.player.scoreSound())
				await self.send(json.dumps(self.player.score.current_rules()))
			if self.player.score.game_end():
				self.game_active = False
				self.gaming.cancel()
				logprint("Game ended")
				await self.send(json.dumps(self.player.score.final_score()))
				return
			await self.send(json.dumps(self.player.gamePos()))
			await asyncio.sleep(self.fps)

	async def disconnect(self, close_code):
		self.connections -= 1
		self.game_active = False
		self.gaming.cancel()
		active_rooms.remove(self.room_group_name)
		if (self.next_round == True):
			logprint("Next round")
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
	
	async def receive(self, text_data):
		try:
			commands = json.loads(text_data)
			if "type" in commands:
				logprint("settings have been set")
				logprint(commands)
				self.player.score.settings(commands)
				logprint(self.player.score.current_rules())
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