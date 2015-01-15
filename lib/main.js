var crypto = require( 'crypto' );

module.exports = function(){
  var args = process.argv.splice( 2 );
  if( args.length < 2 ){
    console.log( 'param is illegal' );
    process.exit();
  }
  userName = args[ 0 ];
  pw = crypto.createHash( 'md5' ).update( args[ 1 ] ).digest( 'hex' );
}