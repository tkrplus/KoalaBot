// Description:
//	respond current weather

var cronJob = require('cron').CronJob;
var moment = require('moment');
moment.locale('ja');

var weatherDict = {"200": "雷と小雨","201": "雷と雨","202": "雷と大雨","210": "軽い雷","211": "雷","212": "すごい雷","221": "とてつもない雷","230": "雷と軽い霧","231": "雷と霧","232": "雷と濃霧","300": "薄い霧","301": "霧","302": "濃い霧","310": "軽い霧雨","311": "霧雨","312": "濃い霧雨","313": "にわか雨と霧","314": "強いにわか雨と霧","321": "一時的に霧","500": "小雨","501": "雨","502": "大雨","503": "激しい大雨","504": "とても激しい大雨","511": "非常に冷たい雨","520": "軽いにわか雨","521": "にわか雨","522": "激しいにわか雨","531": "不規則なにわか雨","600": "小雪","601": "雪","602": "大雪","611": "みぞれ","612": "一時的にみぞれ","615": "小雨時々雪","616": "雨時々雪","620": "軽いにわか雪","621": "にわか雪","622": "激しいにわか雪","701": "もや","711": "煙たい","721": "薄いもや","731": "黄砂","741": "濃いもや","751": "黄砂","761": "塵","762": "火山灰","771": "スコール","781": "竜巻","800": "快晴","801": "晴れ","802": "ちょっと曇り","803": "ちぎれ雲","804": "曇り空","900": "竜巻","901": "熱帯暴風雨","902": "ハリケーン","903": "寒い","904": "暑い","905": "風が強い","906": "穏やかな天気","951": "軽風","952": "軟風","953": "和風","954": "疾風","955": "疾風","956": "雄風","957": "強風","958": "大嵐","959": "猛烈な風","960": "暴風","961": "激しい嵐","962": "ハリケーン"};

module.exports = function(robot) {
	var weatherJob = new cronJob('0 0 8,14 * * *', (function(_this) {
		return function() {
			robot.logger.debug("weatherJob is started.");
			var message;
			robot.http("http://api.openweathermap.org/data/2.5/forecast")
				.query({id: 1850147, units: "metric",APPID: process.env.OPEN_WEATHER_MAP_TOKEN})
				.get()(function(err, response, body) {
					var json = JSON.parse(body);
					message = "今日のこれからの天気は";
					var isBad = false;
					for(var i in json.list) {
						var weatherInfo = json.list[i];
						var date = moment(toTokyoDate(weatherInfo.dt_txt));
						if(!isToday(date)){
							continue;
						}
						message += "\n" + date.format("HH") + "時頃は" + getWeatherTxt(weatherInfo) +"の予定";
						if(isBadWeather(weatherInfo)){
							isBad = true;
							message += "だから気をつけてね。";
						}
					}
					if(isBad){
						message = "<!channel>\n" + message;
					}
					robot.logger.debug("room is "+process.env.SLACK_MAIN_ROOM);
					robot.logger.debug("message is "+message);
					return robot.send({room:process.env.SLACK_MAIN_ROOM}, message);
				});
			};
	})(this));
	return weatherJob.start();
};

isBadWeather = function(weatherInfo){
	var id = weatherInfo.weather[0].id;
	return (id >= 200 && id < 800) || id >= 900;
};

isGoodWeather = function(weatherInfo){
	var id = weatherInfo.weather[0].id;
	return id >= 800 && id < 900;
};

getWeatherTxt = function(weatherInfo){
	return weatherDict[weatherInfo.weather[0].id];
};

toTokyoDate = function(dateStr){
	var date = moment(dateStr);
	date.add(9, "hours");
	return date;
};

isToday = function(date){
	var today = moment();
	return today.date() == date.date();
};

isTomorrow = function(date){
	var tomorrow = moment();
	tommorow.add(1, "days");
	return tomorrow.date() == date.date();
};
