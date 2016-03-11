lang = [
 ["Random/Crypted", 0.045],
 ["Italian",0.075],
 ["English", 0.065],
]
treshold = 0.003

String.prototype.count = function (string) {
  return (this.match(new RegExp(string,'g')) || []).length
}

function mod(x, y) {
	 return (x % y + y) % y;
}

function ctoi(char){
 return char.charCodeAt(0)
}

function IC(string) {
  var n = string.length
  var freq = IC_dict(string)
  // Sum of - fi*(fi-1)
  var sum = 0
  var c=n
  for(var i=0;i<26;i++){
    temp = freq[i]-1
    c-=freq[i]
    sum += (freq[i]*temp)
  }
  console.log(sum+" "+n+" "+c)
  return sum/(n*(n-1))
}

function IC_dict(string){
  var freq = []
  // Single Char frequency - fi
  for(var i=0;i<26;i++){
    freq.push(string.count(String.fromCharCode("a".charCodeAt(0)+i)))
  }
  return freq
}

function shift(str,key){
  var result = ""
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i)
    if      (c >= 65 && c <=  90) result += String.fromCharCode(mod(c - 65 - key, 26) + 65)  // Uppercase
    else if (c >= 97 && c <= 122) result += String.fromCharCode(mod(c - 97 - key, 26) + 97)  // Lowercase
    else result += str.charAt(i)  // Copy
  }
  return result
}

function filter(string) {
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

function divide(string, part){
  var arr = []
  for(var i=0;i<part;i++){
    arr.push("")
  }
  for(var i=0;i<string.length;i++){
    arr[i%part] += string[i]
  }
  return arr
}

function check_lang(ic_val){
  var l = null
  for(var i=0;i<lang.length;i++){
    if(i==0){
      if(lang[0][1]>ic_val){
        l = lang[i][0]
      }
    }else{
      if(ic_val<lang[i][1]+treshold && ic_val>lang[i][1]-treshold){
        l = lang[i][0]
        break
      }
    }
  }
  return l
}

function get_entropy(str,dict) {
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

function get_all_entropies(str,dict) {
 	var result = new Array(26)
 	for (var i = 0; i < 26; i++)
  		result[i] = [i, get_entropy(shift(str, i),dict)]
 	return result
}

function lang_guess(){
  var string = $("#cipher").val()
  string = filter(string)
  var ic_val = IC(string)
  console.log(ic_val)
  var msg = "Text's Coincidence Index is: "+ic_val.toFixed(4)
  var l = check_lang(ic_val)
  if(l!=null){
    msg += "<br/>Language is: "+l
  }
  $("#lang_result").html(msg)
  return l
}

function key_len_guess(){
  key_guess($("#key_len").val())
}

function brute_len_guess(){
  for(var i=1;i<15;i++){
    r=key_guess(i)
    if(r==true){
      break
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
  for(var i=0;i<lang.length;i++){
    if(l==lang[i][0]){
      l=i
      break
    }
  }
  var langObj = null
  if(l==1 || l==2){
     langObj = DICT[l]
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

function key_guess(kl){
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
      if(l!=null && l!=lang[0][0]){
        $tbody.append('<tr />').append("<td class='found'>Found language: "+l+"!</td>")
        found = true
      }
    } else {
      alert("Divide Error!")
    }

    $table.appendTo('#table')
    return found
  }
}

function clear_DOM(){
  $("#table").html("")
  $("#table_mono").html("")
  $("#decipher").val("")
  $("#shift_result").html("")
  $("#lang_result").html("")
}
