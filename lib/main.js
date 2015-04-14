var crypto = require( 'crypto' );
var terMenu = require( 'terminal-menu' );
var betterConsole = require( 'better-console' );
var request = require( 'request' );

_ec = encodeURIComponent;
_dc = decodeURIComponent;

global.token = null;
global.uid = null;
var tOut;
var menu;


module.exports = function(){
  //第一个参数传邮箱或手机号   第二个参数（密码）传MD5加密值或原始值都可以
  var args = process.argv.splice( 2 );
  if( args.length < 2 ){
    console.log( 'param is illegal' );
    process.exit();
  }

  userName = args[ 0 ];
  if( args[ 1 ].length == 32 ){
    pw = args[ 1 ];
  }else{
    pw = crypto.createHash( 'md5' ).update( args[ 1 ] ).digest( 'hex' );
  }

  //
//  request.post({url:"http://xueqiu.com/user/login",headers: {'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'},form: { username: userName, password: pw }},function(err,response,body){
  request.post({url:"http://xueqiu.com/user/login",headers: {'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36', "X-Requested-With":"XMLHttpRequest" },form: { username: userName, password: pw }},function(err,response,body){
    if( err || response.statusCode != 200 ){
      console.log( response.statusCode )
      console.log( err || body );
      return;
    }

  global.token = response.headers[ 'set-cookie' ][ 0 ].split( ';' )[ 0 ].split( '=' )[ 1 ];
  global.xq_r_token = response.headers[ 'set-cookie' ][ 2 ].split( ';' )[ 0 ].split( '=' )[ 1 ];
  global.uid = JSON.parse( body ).user.id;
//  console.log(request.get())
  _initMenu( JSON.parse( body ).user.screen_name );
  });


  function _initMenu( userName ){
    menu = terMenu({ width: 40, x: 40, y: 0 });
    menu.reset();
    menu.write('雪球Terminal('+ userName +')\n');
    menu.write('-------------------------\n');

    menu.add('自选股票');
    menu.add('招行动态');
    menu.add('暂停');
    menu.add('退出');

    menu.on( 'select', function ( label ) {
      menu.charm.position( 1, menu.y + 1 );
//      menu.charm.erase( 'down' );
      if( tOut ) clearTimeout( tOut );
      switch ( menu.selected ){
        case 0:
          var getCodeUrl = 'http://xueqiu.com/v4/stock/portfolio/stocks.json?size=1000&tuid='+ uid +'&pid=-1&category=2&type=1';
          var j = request.jar();
          var cookie = request.cookie('xq_a_token=' + global.token );
//          var cookie1 = request.cookie('xq_r_token=' + global.xq_r_token );
//          j.setCookie(cookie1, getCodeUrl);
          j.setCookie(cookie, getCodeUrl);
//          j.setCookie(cookie1, getCodeUrl);

          request.get( { url : getCodeUrl, jar : j, headers: {'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'} }, function( err,response,body ){
            if( err || response.statusCode != 200 ){
//              console.log( err || body );
              return
            }
            codes = 'SH000001,';  //DJI30,HKHSI,';
//            console.log( body );
            stocks = JSON.parse( body ).stocks;
            for( var i = 0, len = stocks.length; i < len; i++ ){
              codes += stocks[ i ].code + ','
            }
            codes = codes.substring( 0, codes.length - 1 );
            codes = _ec( codes );

            var getMySelectDadaUrl = 'http://xueqiu.com/v4/stock/quote.json?code=' + codes;

            var j = request.jar();
            var cookie = request.cookie('xq_a_token=' + global.token );
            j.setCookie( cookie, getMySelectDadaUrl );

            request.get( { url : getMySelectDadaUrl, jar: j }, function( err, response, body ){
              if( err || response.statusCode != 200 ){
                console.log( err || body );
                return;
              }

              var stocksInfo = JSON.parse( body );
              var table = [['代码','名称','当前价格','涨幅百分比','涨幅']];
              for( info in stocksInfo ){
                var temp = []
                temp.push( stocksInfo[info]['symbol'] );
                temp.push( stocksInfo[info]['name'] );
                temp.push( stocksInfo[info]['current'] );
                temp.push( stocksInfo[info]['percentage'] );
                temp.push( stocksInfo[info]['change'] );

                table.push( temp );
              }

              betterConsole.table( table );
              tOut = setTimeout( _repeat ,10000 );

            });
          });
          break;
        case 1:
          menu.charm.position( 1, menu.y + 1 );
//          menu.charm.erase( 'down' );
          var url = "http://hq.sinajs.cn/list=sh600036";
          request.get( { url : url }, function( err, response, body ){
            if( err || response.statusCode != 200 ){
              console.log( err || body );
              return;
            }

            var info = new Buffer(body.toString()).toString('utf8').split('=')[1].split(',');
            var table = [];
            table.push(['招商银行',"--------","--------","--------","--------","--------"]);
            table.push( ['todayBegin','yesterdayEnd','current','todayHighest','todayMinimum'] );
            table.push([info[1],info[2],info[3],info[4],info[5]]);
            table.push(['buy 1','buy 2','buy 3','buy 4','buy 5']);
            table.push([parseInt(info[10]/100)+'('+info[11]+')',parseInt(info[12]/100)+'('+info[13]+')',parseInt(info[14]/100)+'('+info[15]+')',parseInt(info[16]/100)+'('+info[17]+')',parseInt(info[18]/100)+'('+info[19]+')']);

            table.push(['sell 1','sell 2','sell 3','sell 4','sell 5']);
            table.push([parseInt(info[20]/100)+'('+info[21]+')',parseInt(info[22]/100)+'('+info[23]+')',parseInt(info[24]/100)+'('+info[25]+')',parseInt(info[26]/100)+'('+info[27]+')',parseInt(info[28]/100)+'('+info[29]+')']);

            betterConsole.table( table );
            tOut = setTimeout( _repeat ,4000 );
          });
          break;
        case 2:
          menu.charm.position( 1, menu.y + 1 );
          menu.charm.erase( 'down' );
          console.log( '暂停。。' );
          break;
        case 3:
          menu.close();
          break;
      }

    });

    process.stdin.pipe(menu.createStream()).pipe(process.stdout);
    process.stdin.setRawMode(true);

    menu.on('close', function () {
      if(tOut) clearTimeout(tOut);
      process.stdin.setRawMode(false);
      process.stdin.end();
    });
  }

  function _repeat(){
    if( tOut ) clearTimeout( tOut );
    menu.emit( 'select', menu.items[menu.selected].label, menu.selected );
    menu.charm.position( 1, menu.y + 1 );
  }

}



























