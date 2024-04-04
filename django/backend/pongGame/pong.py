from django.http import JsonResponse
import string
import random
import json


class Player:
	def __init__(self):
#player 1
		self.x1 = 4
		self.y1 = 45
		self.width1 = 2
		self.height1 = 17
#player 2
		self.x2 = 96
		self.y2 = 45
		self.width2 = 2
		self.height2 = 17

#ball
		self.ball = Ball()

		self.score = Rules()


	def gamePos(self):
		game_data = {
			'x1': self.x1,
			'y1': self.y1,
			'x2' : self.x2,
			'y2' : self.y2,
			"ballx": self.ball.x,
			"bally": self.ball.y,
			"score1": self.score.player_1_score,
			"score2": self.score.player_2_score,
		}
		return game_data

	def move(self, data):
		if data['movement'] == 'up':
			if data['player'] == 'player1':
				if self.y1 > 2:
					self.y1 = self.y1 - 2
			elif data['player'] == 'player2':
				if self.y2 > 2:
					self.y2 = self.y2 - 2
		elif data['movement'] == 'down':
			if data['player'] == 'player1':
				if self.y1 < 82:
					self.y1 = self.y1 + 2
			elif data['player'] == 'player2':
				if self.y2 < 82:
					self.y2 = self.y2 + 2




class Ball:
	def __init__(self):
		self.x = 50
		self.y = 20
		self.radius = 1.25
		self.speed = 1
		self.direction_x = 1
		self.direction_y = 1

	def ball_position(self):
		ball_data = {
			'x': self.x,
			'y': self.y,
			'radius': self.radius,
		}
		return ball_data
	
	# recognize here if the ball has hit the player
	def collision(self, player):
		#ball > player height && ball height + radius <= player.height + 8.5 (paddle radius)
		if self.y + self.radius > player.y1 and self.y + self.radius <= player.y1 + player.height1:
			if self.x + self.radius < player.x1 + player.width1 and self.x + self.radius > player.x1:
				if self.y + self.radius > player.y1 + 2:
					self.direction_y -= 0.3
				elif self.x + self.radius < player.y1 + 2:
					self.direction_y += 0.3
				if self.x + self.radius >= player.x1  and self.x + self.radius <= player.x1 + 2:
					self.x += self.radius 
				return True
		if self.y + self.radius > player.y2 and self.y + self.radius <= player.y2 + player.height2:
			if self.x + self.radius < player.x2 + player.width2 and self.x + self.radius > player.x2:
				if self.x + self.radius > player.y2 + 2:
					self.direction_y -= 0.3
				elif self.x + self.radius < player.y2 + 2:
					self.direction_y += 0.3
				if self.x + self.radius >= player.x2  and self.x + self.radius <= player.x2 + 2:
					self.x -= self.radius 
				return True
		return False
	
	
	def move_ball(self):
		if self.x > 99:
			return False
		else:
			if self.x < 1:
				return False
		self.x += self.speed * self.direction_x
		if self.y > 99 or self.y < 1:
			self.direction_y = -self.direction_y
		self.y += self.speed * self.direction_y
		return True


	def reset_ball(self, score):
		self.x = 50
		self.y = 20
		self.direction_x = 1
		self.direction_y = 1
		self.speed = 1
	

class Rules:
	def __init__(self):
		self.score_to_win = 3
		self.rounds_to_win = 1
		self.player_1_name = "Player 1"
		self.player_2_name = "Player 2"
		self.player_1_score = 0
		self.player_2_score = 0
		self.mirror = False

	def scoring(self, gamePos):

		if gamePos['ballx'] < 1.5:
			self.player_1_score += 1
		elif gamePos['ballx'] > 98.5:
			self.player_2_score += 1

	def game_end(self):
		if self.player_1_score == self.score_to_win or self.player_2_score == self.score_to_win:
			return True
		else:
			return False

#updating settings
	def settings(self, data):
		self.score_to_win = data['score']
		self.rounds_to_win = data['rounds']
		self.mirror = data['mirror']
		if self.mirror == True:
			self.player_2_name = data['player1']
			self.player_1_name = data['player2']
		else:
			self.player_1_name = data['player1']
			self.player_2_name = data['player2']

	def current_score(self):
		score_data = {
			'player1-score' : self.player_1_score,
			'player2-score' : self.player_2_score,
		}
		return score_data
	
	def current_rules(self):
		rules_data = {
			'score_to_win' : self.score_to_win,
			'rounds_to_win' : self.rounds_to_win,
			'player_1_name' : self.player_1_name,
			'player_2_name' : self.player_2_name,
			'mirror' : self.mirror,
		}
		return rules_data


def randomCode():
	return ''.join(random.choice(string.ascii_letters) for _ in range(4))

