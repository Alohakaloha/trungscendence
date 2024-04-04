from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from . import pong
import sys

def logprint(*args, **kwargs):		
	print(*args, file=sys.stderr, **kwargs)


class PongGameConsumer(AsyncWebsocketConsumer):
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
		if (self.connections < 2):
			await self.accept()
			self.connections += 1
		else:
			return

		self.game_active = True
		asyncio.create_task(self.game_loop())


	async def game_loop(self):
		while self.game_active:
			if self.player.ball.collision(self.player) is True:
				if self.player.ball.speed < 1.5:
					self.player.ball.speed += 0.1
				self.player.ball.direction_x = -self.player.ball.direction_x
			if(self.player.ball.move_ball() == False):
				self.player.score.scoring(self.player.gamePos())
				self.player.ball.reset_ball(self.player.score)
			await self.send(json.dumps(self.player.gamePos()))
			await asyncio.sleep(0.01)


	async def disconnect(self, close_code):
		self.connections -= 1
		logprint("Connection closed with code", close_code)
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
					action = json.loads(action)  # Convert action to a dictionary if it's not already
				if "settings" in action:
					self.player.score.settings(action)
					await self.send(json.dumps(self.player.score.current_rules()))
				elif "movement" in action:
					self.player.move(action)
				elif "update" in action:
					await self.send(json.dumps(self.player.gamePos()))
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data}")
