var crypto = require( 'crypto' );
var terMenu = require( 'terminal-menu' );
var betterConsole = require( 'better-console' );
var request = require( 'request' );

_ec = encodeURIComponent;

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
  request.post({url:"http://xueqiu.com/user/login",form: { username: userName, password: pw }},function(err,response,body){
    if( err || response.statusCode != 200 ){
      console.log( err || body );
      return;
    }

  global.token = response.headers[ 'set-cookie' ][ 0 ].split( ';' )[ 0 ].split( '=' )[ 1 ];
  global.uid = JSON.parse( body ).user.id;
  _initMenu( JSON.parse( body ).user.screen_name );

  });


  function _initMenu( userName ){
    menu = terMenu({ width: 40, x: 40, y: 0 });
    menu.reset();
    menu.write('雪球Terminal('+ userName +')\n');
    menu.write('-------------------------\n');

    menu.add('自选股票');
    menu.add('退出');

    menu.on( 'select', function ( label ) {
      switch ( menu.selected ){
        case 0:
          var getCodeUrl = 'http://xueqiu.com/v4/stock/portfolio/stocks.json?size=1000&tuid='+ uid +'&pid=-1&category=2&type=1';
          var j = request.jar();
          var cookie = request.cookie('xq_a_token=' + global.token );
          j.setCookie(cookie, getCodeUrl);

          request.get( { url : getCodeUrl, jar : j }, function( err,response,body ){
            if( err || response.statusCode != 200 ){
              console.log( err || body );
              return
            }
            codes = 'SH000001,DJI30,HKHSI,';
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
              tOut = setTimeout( _repeat ,2000 );

            });
          });
          break;
        case 1:
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