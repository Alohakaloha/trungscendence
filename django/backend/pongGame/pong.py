from django.http import JsonResponse
import string
import sys
import random
import time


def logprint(*args, **kwargs):		
	print(*args, file=sys.stderr, **kwargs)

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
			"p1Rounds" : self.score.player_1_rounds,
			"score2": self.score.player_2_score,
			"p2Rounds" : self.score.player_2_rounds,
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

	def Wall_Sound(self):
		game_sound = {
			'sounds': 'wall',
		}
		return game_sound

	def Player_Sound(self):
		game_sound = {
			'sounds': 'player',
		}
		return game_sound

	def Score_Sound(self):
		game_sound = {
			'sounds': 'ring',
		}
		return game_sound


class Ball:
	def __init__(self):
		self.x = 50
		self.y = 50
		self.radius = 1.25
		self.speed = 0.36
		self.direction_x = random.choice([-1, 1])
		self.direction_y = random.choice([-1,0, 1])

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
				if self.y + self.radius > player.y1 + 4:
					self.direction_y -= 0.3
				elif self.x + self.radius < player.y1 + 11:
					self.direction_y += 0.3
				if self.x + self.radius >= player.x1  and self.x + self.radius <= player.x1 + 2:
					self.x += self.radius 
				return True
		if self.y + self.radius > player.y2 and self.y + self.radius <= player.y2 + player.height2:
			if self.x + self.radius < player.x2 + player.width2 and self.x + self.radius > player.x2:
				if self.x + self.radius > player.y2 + 4:
					self.direction_y -= 0.3
				elif self.x + self.radius < player.y2 + 11:
					self.direction_y += 0.3
				if self.x + self.radius >= player.x2  and self.x + self.radius <= player.x2 + 2:
					self.x -= self.radius 
				return True
		return False
	

	def wall_collision(self):
		if self.y > 99 or self.y < 1:
			self.direction_y = -self.direction_y
			self.y += self.speed * self.direction_y
			return True
		self.x += self.speed * self.direction_x
		self.y += self.speed * self.direction_y
		return False


	def boundaries(self):
		if self.x > 99:
			return False
		else:
			if self.x < 1:
				return False
		return True


	def reset_ball(self):	
		self.x = 50
		self.y = 50
		self.direction_x = random.choice([-1, 1])
		self.direction_y = random.choice([-1,0, 1])
		self.speed = 0.36
	

class Rules:
	def __init__(self):
		self.score_to_win = 3
		self.rounds_to_win = 1


		self.player_1_name = "Player 1"
		self.player_1_score = 0
		self.player_1_rounds = 0

		self.player_2_name = "Player 2"
		self.player_2_rounds = 0
		self.player_2_score = 0
		self.winner = None
		self.mirror = False

	def scoring(self, gamePos):
		if gamePos['ballx'] < 1.5:
			self.player_2_score += 1
			return True
		elif gamePos['ballx'] > 98.5:
			self.player_1_score += 1
			return True
		return False

	def next_round(self):
		self.player_1_score = int(self.player_1_score)
		self.player_2_score = int(self.player_2_score)
		self.score_to_win = int(self.score_to_win)
		if self.player_1_score == self.score_to_win:
			self.player_1_rounds += 1
			self.player_1_score = 0
			self.player_2_score = 0
		elif self.player_2_score == self.score_to_win:
			self.player_2_rounds += 1
			self.player_1_score = 0
			self.player_2_score = 0


	def game_end(self):
		self.player_1_rounds = int(self.player_1_rounds)
		self.player_2_rounds = int(self.player_2_rounds)
		self.score_to_win = int(self.score_to_win)
		
		if self.player_1_rounds == self.rounds_to_win:
			self.winner = self.player_1_name
			return True
		elif self.player_2_rounds == self.rounds_to_win:

			self.winner = self.player_2_name
			return True
		return False
		

#updating settings
	def settings(self, data):
		self.score_to_win = int(data['score'])
		self.rounds_to_win =int (data['rounds'])
		if "mirror" in data:
			self.mirror = data['mirror']
		if self.mirror == True:
			self.player_2_name = data['player1']
			self.player_1_name = data['player2']
		else:
			self.player_1_name = data['player1']
			self.player_2_name = data['player2']




	def current_rules(self):
		rules_data = {
			'type' : 'rules',
			'score_to_win' : self.score_to_win,
			'rounds_to_win' : self.rounds_to_win,
			'player_1_name' : self.player_1_name,
			'player_1_rounds' : self.player_1_rounds,
			'player1_score' : self.player_1_score,
			'player_2_name' : self.player_2_name,
			'player_2_rounds' : self.player_2_rounds,
			'player2_score' : self.player_2_score,
			'mirror' : self.mirror,
		}
		return rules_data

	def final_score(self):
		game_result = {
			'game_over' : 'true',
			'player1_rounds' : self.player_1_rounds,
			'player2_rounds' : self.player_2_rounds,
			'winner' : self.winner,
		}
		return game_result

def randomCode():
	return ''.join(random.choice(string.ascii_letters) for _ in range(4))

