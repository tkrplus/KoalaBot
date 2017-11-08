# Description:
#   Google Authentication for hubot
#
# 4/.AABaX1_9GqtjSrBJHpUZCnPFx-OVipBCwfAmFW2O2-K0-64gV889b8SMdYi1QEjGJuq5ZoxsaWLGL3ER6og8cMQ

google = require('googleapis')
OAuth2 = google.auth.OAuth2

CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
REDIRECT_URL = "urn:ietf:wg:oauth:2.0:oob" #process.env.HUBOT_HEROKU_KEEPALIVE_URL + 'oauth/callback'
OAUTH_SCOPE = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/calendar']

oauthClient = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

module.exports = (robot) ->

	robot.respond /googleAuth authorize/i, (msg) ->
		url = oauthClient.generateAuthUrl({ scope: OAUTH_SCOPE,access_type:"offline"});
		msg.send "次のリンクにアクセスして認可してください。\n認可後に `@Koala googleAuth callBack ~~~` を実行し、アクセストークンを発行・設定してください。\n#{url}" 

	robot.respond /googleAuth callBack (.*)$/, (msg) ->
		authorizeCode = msg.match[1]
		oauthClient.getToken authorizeCode, (err, tokens) ->
			if err
				msg.send "アクセストークン発行に失敗しました。\n#{err}"
				return
			oauthClient.credentials = tokens
			robot.logger.debug tokens
			robot.logger.debug JSON.stringify(tokens)
	
			robot.brain.set(getGoogleAuthRedisKey('accessToken'), tokens)
			msg.send "アクセストークン、リフレッシュトークンを設定しました。"

	robot.respond /googleAuth show settings/i, (msg) ->
		msg.send 'アクセストークン:' + JSON.stringify(robot.brain.get(getGoogleAuthRedisKey('accessToken'))) + '\n'

	getGoogleAuthRedisKey = (name) -> 
		return 'googleAuth:oauth:' + name

	# initialize tokens
	currentTokens = robot.brain.get(getGoogleAuthRedisKey('accessToken'))
	if currentTokens
		oauthClient.credentials = tokens