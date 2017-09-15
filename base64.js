var base64 = {}

// original base64 encoding
base64.encString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// URL and file name safe encoding
base64.encStringS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';


base64.encode = function(inp, uc, safe) {
  // do some argument checking
  if (arguments.length < 1) return null;
  var readBuf = new Array();    // read buffer
  if (arguments.length >= 3 && safe != true && safe != false) return null;
  var enc = (arguments.length >= 3 && safe) ? base64.encStringS : base64.encString; // character set used
  var b = (typeof inp == "string"); // how input is to be processed
  if (!b && (typeof inp != "object") && !(inp instanceof Array)) return null; // bad input
  if (arguments.length < 2) {
    uc = true;                  // set default
  } // otherwise its value is passed from the caller
  if (uc != true && uc != false) return null;
  var n = (!b || !uc) ? 1 : 2;  // length of read buffer
  var out = '';                 // output string
  var c = 0;                    // holds character code (maybe 16 bit or 8 bit)
  var j = 1;                    // sextett counter
  var l = 0;                    // work buffer
  var s = 0;                    // holds sextett
  
  // convert  
  for (var i = 0; i < inp.length; i++) {  // read input
    c = (b) ? inp.charCodeAt(i) : inp[i]; // fill read buffer
    for (var k = n - 1; k >= 0; k--) {
      readBuf[k] = c & 0xff;
      c >>= 8;
    }
    for (var m = 0; m < n; m++) {         // run through read buffer
      // process bytes from read buffer
      l = ((l<<8)&0xff00) | readBuf[m];   // shift remaining bits one byte to the left and append next byte
      s = (0x3f<<(2*j)) & l;              // extract sextett from buffer
      l -=s;                              // remove those bits from buffer;
      out += enc.charAt(s>>(2*j));        // convert leftmost sextett and append it to output
      j++;
      if (j==4) {                         // another sextett is complete
        out += enc.charAt(l&0x3f);        // convert and append it
        j = 1;
      }
    }        
  }
  switch (j) {                            // handle left-over sextetts
    case 2:
      s = 0x3f & (16 * l);                // extract sextett from buffer
      out += enc.charAt(s);               // convert leftmost sextett and append it to output
      out += '==';                        // stuff
      break;
    case 3:
      s = 0x3f & (4 * l);                 // extract sextett from buffer
      out += enc.charAt(s);               // convert leftmost sextett and append it to output
      out += '=';                         // stuff
      break;
    default:
      break;
  }

  return out;
  
}
