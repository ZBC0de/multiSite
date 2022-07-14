let express = require('express');
let io;
let app = express();
let socket = require('socket.io');
let moment = require('moment');
let server;
let converter = require('number-to-words-en');
let os = require('os');
let request = require('request');
let clock = require('react-clock');
let options = {
    'method': 'GET',
    'units': 'imperial',
    'headers': {
    }
};
let mysql = require('mysql');
let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'test'
});

con.connect(function(err){
    if(err){
        console.log(err);
    }else {
        console.log('Connection Successful');
    }
})



function client() {
    server = app.listen(80, function () {
        console.log('Let it begin...')

        app.use(express.static('public')) // to use public folder

        io = socket(server); // same as io = socket.app.listen

        io.on('connection', (socket) => {//start of socket.io

            console.log('Socket Connected!')

            socket.on('js', function (data) {


                let msg = JSON.parse(data);

                switch (msg.type) {

                    case 'takeNum':
                   console.log(msg.data);

                        let result_guy = converter.toWords(msg.data, { useCommas: false});
                        console.log(result_guy);

                        io.emit('html', JSON.stringify({type:'assignWord', data:result_guy}));


                        break;

                    case 'julian':
                        let julianDate = julianDateCalc();
                        console.log(julianDate);

                        io.emit('html', JSON.stringify({type:'assignJulian', data:julianDate}));

                        break;

                    case 'getWeatherData':
                        request({url:`https://api.openweathermap.org/data/2.5/weather?zip=${msg.data},us&appid=371d70f4b089945e5ad9321b5553b7c9`}, function (error, response) {
                            if (error) throw new Error(error)
                                else{
                                    console.log('Received Weather Data!');
                            };



                            io.emit('html', JSON.stringify({type:'assignWeather', data:response.body, whole:response}));
                        });

                        break;

                    case 'getOS':
                        let sysInfo = os.userInfo()
                        let cpuInfo = os.cpus()
                        let memory = os.freemem()

                        console.log(sysInfo)
                        console.log(cpuInfo)
                        console.log('MEMORYINFO ' + memory)
                        io.emit('html', JSON.stringify({type:'assignOS', sys:sysInfo, cpu:cpuInfo, mem:memory}))
                        break;

                    case 'getMovieDetails':
                        request({url:`https://api.themoviedb.org/3/search/movie?api_key=b4918575377c8299d350a2e6a8f10c1a&query=${msg.data}`}, function (error, response) {
                            if (error) throw new Error(error);
                            // console.log(response.body);
                            io.emit('html', JSON.stringify({type:'assignMovie', data:response.body}))
                        });
                        break;

                    case 'submitChat':
                        let message = `${msg.data}<br>`;
                        io.emit('html', JSON.stringify({type: 'addChat', data:message}));
                        break;

                    case 'math':
                        let num1 = parseInt(msg.n1);
                        let num2 = parseInt(msg.n2);
                        if(msg.sym === '+'){
                            io.emit('html', JSON.stringify({type:'result', result:num1+num2}))
                        }
                        if(msg.sym === '-'){
                            io.emit('html', JSON.stringify({type:'result', result:num1-num2}))
                        }
                        if(msg.sym === '*'){
                            io.emit('html', JSON.stringify({type:'result', result:num1*num2}))
                        }
                        if(msg.sym === '/'){
                            io.emit('html', JSON.stringify({type:'result', result:num1/num2}))
                        }
                        if(msg.sym === '**'){
                            io.emit('html', JSON.stringify({type:'result', result:Math.pow(num1, num2)}))
                        }
                        if(msg.sym === '%'){
                            io.emit('html', JSON.stringify({type:'result', result:num1%num2}))
                        }
                        break;

                    case 'addDB':
                        if(msg.user.length === 0 || msg.pass.length === 0){
                            io.emit('html', JSON.stringify({type:'signupStatus', data:'Please Fill Out All Forms..'}))
                        }else {

                            con.query('INSERT INTO userinfo SET?', {
                                username: msg.user,
                                password: msg.pass
                            }, function (err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(result);
                                }
                            });
                        }
                        break;

                    case 'checkDB':


                        con.query(`SELECT * FROM userinfo WHERE username = '${msg.user}' AND password = '${msg.pass}'`, function(err,result){
                            if(err) {
                                console.log(err);
                                io.emit('html', JSON.stringify({type:'validation', data:'Invalid User!'}));
                            }else {
                                if (msg.user === result[0].username && msg.pass === result[0].password) {
                                    io.emit('html', JSON.stringify({type:'validation', data:'Valid User!', user:result[0].username, pfp:result[0].profilePicture}));
                                }
                            }
                            console.log(result);
                        });
                        break;
                    default:
                        break;
                }

            })
        })

    })
}
client();


function julianDateCalc(){
let addonDays = 0;
let currentDate = moment().format('l');
let year = currentDate.slice(5, 9);
let shortYear = currentDate.slice(7, 9);
let month = currentDate.slice(0, 1);
month = month.replace('/', '');
let day = currentDate.slice(2, 4);
let months = [
    31, //JAN
    28, //FEB
    31, //MAR
    30, //APR
    31, //MAY
    30, //JUN
    31, //JUL
    31, //AUG
    30, //SEP
    31, //OCT
    30, //NOV
    31 //DEC
    ]
    if (moment([year]).isLeapYear()) {
        months[1] = 29;
        for (let i = month -1; i >= 0; i--) {
            addonDays = addonDays + months[i];
        }
    }else{
        for(let i = month -1; i>= 0; i--) {
            addonDays = addonDays + months[i];
        }
    }
    let daysFromMonth = addonDays;
    let days = months[month-1];
    let dayRemaining = months[month-1] - day;
    let daysRemainder = days - daysFromMonth;
    addonDays = addonDays - daysRemainder;
    console.log(shortYear + addonDays);
    return(shortYear + addonDays);
}









