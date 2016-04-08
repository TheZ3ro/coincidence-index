lang = [
 ["Random/Crypted", 0.045],
 ["Italian",0.075],
 ["English", 0.065],
]
treshold = 0.0049

String.prototype.count = function (string) {
  return (this.match(new RegExp(string,'g')) || []).length
}

var mod = function(x, y) {
	 return (x % y + y) % y;
}

var ctoi = function(char){
 return char.charCodeAt(0)
}

/*
---- Math Funciton ----
*/

var IC = function(string) {
  var n = string.length
  var freq = IC_dict(string)
  // Sum of - fi*(fi-1)
  var sum = 0
  for(var i=0;i<26;i++){
    temp = freq[i]-1
    sum += (freq[i]*temp)
  }
  return sum/(n*(n-1))
}

var IC_dict = function(string){
  var freq = []
  // Single Char frequency - fi
  for(var i=0;i<26;i++){
    freq.push(string.count(String.fromCharCode("a".charCodeAt(0)+i)))
  }
  return freq
}

var IMC = function(str1,str2){
  var n1 = str1.length
  var n2 = str2.length
  var freq1 = IC_dict(str1)
  var freq2 = IC_dict(str2)
  // Sum of - fi1*fi2
  var sum = 0
  for(var i=0;i<26;i++){
    sum += (freq1[i]*freq2[i])
  }
  return sum/(n1*n2)
}

var shift = function(str,key){
  var result = ""
  if(typeof key == "string"){
    // Vigenere
    for (var i = 0; i < str.length; i++) {
      var index = i%key.length
      var c = str.charCodeAt(i)
      if      (c >= 65 && c <=  90) result += String.fromCharCode(mod(c - key.charCodeAt(index), 26) + 65)  // Uppercase
      else if (c >= 97 && c <= 122) result += String.fromCharCode(mod(c - key.charCodeAt(index), 26) + 97)  // Lowercase
      else result += str.charAt(i)  // Copy
    }
  }else{
    // Shift
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i)
      if      (c >= 65 && c <=  90) result += String.fromCharCode(mod(c - 65 - key, 26) + 65)  // Uppercase
      else if (c >= 97 && c <= 122) result += String.fromCharCode(mod(c - 97 - key, 26) + 97)  // Lowercase
      else result += str.charAt(i)  // Copy
    }
  }
  return result
}

var filter = function(string) {
  var string = string.toLowerCase()
  var ret = ""
  for(var i=0;i<string.length;i++){
    actual = string.charCodeAt(i)
    if(actual >= 97 && actual <= 122){
      ret += String.fromCharCode(actual)
    }
  }
  return ret
}

var divide = function(string, part){
  var arr = []
  for(var i=0;i<part;i++){
    arr.push("")
  }
  for(var i=0;i<string.length;i++){
    arr[i%part] += string[i]
  }
  return arr
}

var check_lang = function(ic_val){
  var l = []
  for(var i=0;i<lang.length;i++){
    if(i==0){
      if(lang[0][1]+treshold>ic_val){
        l[0] = lang[i][0]
        l[1] = i
        break
      }
    }else{
      if(ic_val<lang[i][1]+treshold && ic_val>lang[i][1]-treshold){
        l[0] = lang[i][0]
        l[1] = i
        break
      }
    }
  }
  return l
}

var get_entropy = function(str,dict) {
 	var sum = 0
 	var ignored = 0
 	for (var i = 0; i < str.length; i++) {
  		var c = str.charCodeAt(i)
  		if      (c >= 65 && c <=  90) sum += Math.log(dict[c - 65])  // Uppercase
  		else if (c >= 97 && c <= 122) sum += Math.log(dict[c - 97])  // Lowercase
  		else ignored++
 	}
 	return -sum / Math.log(2) / (str.length - ignored)
}

var get_all_entropies = function(str,dict) {
 	var result = new Array(26)
 	for (var i = 0; i < 26; i++)
  		result[i] = [i, get_entropy(shift(str, i),dict)]
 	return result
}

/*
---- GUI Funciton ----
*/

function lang_guess(){
  var string = $("#cipher").val()
  string = filter(string)
  var ic_val = IC(string)
  console.log(ic_val)
  var msg = "Text's Coincidence Index is: "+ic_val.toFixed(4)
  var l = check_lang(ic_val)
  if(l[0]!=null){
    msg += "<br/>Language is: "+l[0]
  }
  $("#lang_result").html(msg)
  return l
}

function brute_keylen(){
  for(var i=1;i<15;i++){
    r=keylen_guess(i)
    if(r!=null){
      return r
    }
  }
}

function shift_text(){
  var string = $("#cipher").val()
  string = filter(string)

  var key = $("#shift_key").val()
  if(key=="" || isNaN(key)){
    alert("Insert a valid Shift key")
  }else{
    $("#decipher").val(shift(string,parseInt(key)))
  }
}

function shift_guess(){
  var l = lang_guess()
  var langObj = null
  if(l[1]==1 || l[1]==2){
    langObj = DICT[l[1]]
  }else{
    $("#shift_result").html("Can't detect the text language, probably it's a Polialphabetic Ciphertext")
    return
  }

  var string = $("#cipher").val()
  string = filter(string)

  entropies = get_all_entropies(string,langObj)
 	entropies.sort(function(x, y) {
  		// Compare by lowest entropy, break ties by lowest shift
  		if (x[1] < y[1]) return -1
  		else if (x[1] > y[1]) return 1
  		else if (x[0] < y[0]) return -1
  		else if (x[0] > y[0]) return 1
  		else return 0
 	});

  var best_shift = entropies[0][0]

  $("#shift_result").html("This text is (probably) shifted by "+best_shift+" with "+entropies[0][1].toFixed(4)+" entropy")

  $("#table_mono").html("")
  var $table = $('<table>');
  $table.append('<thead>').children('thead')
    .append('<tr />').children('tr').append("<th>Shift</th>").append("<th>Entropy</th>")

  var $tbody = $table.append('<tbody />').children('tbody')
  $tbody.append('<tr />')

  for(var i=0;i<entropies.length;i++){
    $tbody.append('<tr />').append("<td>"+entropies[i][0]+"</td>").append("<td>"+entropies[i][1]+"</td>")
  }
  $table.appendTo('#table_mono')

  $("#decipher").val(shift(string,best_shift))
}

function keylen_guess(kl){
  var keylen = kl
  var found = false
  if(keylen=="" || isNaN(keylen)){
    alert("Insert a valid key-lenght")
  }else{
    keylen = parseInt(keylen)

    $("#table").html("")
    var $table = $('<table>');
    $table.append('<thead>').children('thead')
      .append('<tr />').children('tr').append('<th>Coincidence Index for Key-Length '+keylen+'</th>');

    var $tbody = $table.append('<tbody />').children('tbody');

    var arr = divide(filter($("#cipher").val()),keylen)
    var sum = 0
    if(arr.length == keylen){
      for(var i=0;i<keylen;i++){
        var ic_arr = IC(arr[i])
        sum += ic_arr
        $tbody.append('<tr />').append("<td>"+ic_arr+"</td>")
      }
      var media = sum/keylen
      var l = check_lang(media)
      if(l.length!=0 && l[0]!=lang[0][0]){
        $tbody.append('<tr />').append("<td class='found'>Found language: "+l[0]+"!</td>")
        found = true
      }

      $table.appendTo('#table')
      if(found==true) return [ic_arr,arr]
    } else {
      alert("Divide Error!")
    }
  }
  return null
}

function guess_key(){
  var arr = brute_keylen()[1]
  var k = []
  var ic = 0
  var max = [null,0.0000]

  for(var i=0;i<arr.length-1;i++){
    imc = IMC(arr[i],arr[i+1])
    max = [0,imc]
    for(var j=1;j<26;j++){
      shifted = shift(arr[i+1],j)
      imc = IMC(arr[i],shifted)
      if(imc>max[1]){
        max = [j,imc]
      }
    }
    k.push(max[0])
    ic += max[1]
  }
  ic = ic/k.length
  // find out the best K(0)
  var l = check_lang(ic)
  var langObj = null
  if(l[1]==1 || l[1]==2){
    langObj = DICT[l[1]]
  }else{
    $("#key_result").html("Can't detect the text language :(")
    return
  }
  console.log(k+" "+langObj)
  // Bruteforce entroy on C(0) with K(0)
  entropies = get_all_entropies(arr[0],langObj)
  entropies.sort(function(x, y) {
    // Compare by lowest entropy, break ties by lowest shift
    if (x[1] < y[1]) return -1
    else if (x[1] > y[1]) return 1
    else if (x[0] < y[0]) return -1
    else if (x[0] > y[0]) return 1
    else return 0
  });

  var best_shift = entropies[0][0]
  var msg = "Best entropy shift for K<sub>0</sub> is: "+best_shift+"<br/>"
  // Now find the other shift
  var key = String.fromCharCode(best_shift+97)
  var prec = best_shift
  for(var i=0;i<k.length;i++){
    prec = mod(prec + k[i],26)
    key += String.fromCharCode(prec+97)
  }
  msg += "The most probable key is: "+key
  $("#key_result").html(msg)

  var dec = ""
  var string = $("#cipher").val()
  string = filter(string)
  $("#decipher").val(shift(string,key))
}

function clear_DOM(){
  $("#table").html("")
  $("#table_mono").html("")
  $("#decipher").val("")
  $("#shift_result").html("")
  $("#lang_result").html("")
  $("#key_result").html("")
}
