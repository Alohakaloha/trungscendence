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

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		# player_class
		self.player = pong.Player()
		# score
		self.score = pong.Rules()

		await self.accept()

		self.game_active = True
		asyncio.create_task(self.game_loop())


	async def game_loop(self):
		while self.game_active:
			self.player.ball.move_ball()
			if self.player.ball.collision(self.player):
				self.player.ball.direction_x = -self.player.ball.direction_x
			await self.send(json.dumps(self.player.gamePos()))
			await asyncio.sleep(0.02)


	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
	
	async def receive(self, text_data):
		try:
			text = json.loads(text_data)
			if "settings" in text:
				self.score.settings(text)
				await self.send(json.dumps(self.score.current_rules()))
			elif "movement" in text:
				self.player.move(text)
				await self.send(json.dumps(self.player.gamePos()))
			elif "update" in text:
				await self.send(json.dumps(self.player.gamePos()))
		except json.JSONDecodeError:
			logprint(f"Invalid JSON: {text_data}")
