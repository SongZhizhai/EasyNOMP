function calculateEMA(mArray, mRange) {
  var k = 2/ (mRange + 1);
  // first item is just the same as the first item in the input
  emaArray = [{t: mArray[0].t, y: mArray[0].y}];
  // for the rest of the items, they are computed with the previous one
  for (var i = 1; i < mArray.length; i++) {
    var height = mArray[i].y * k + emaArray[i - 1].y * (1 - k);
    emaArray.push({ t: mArray[i].t, y: height });
  }
  return emaArray;
}

function capFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getRandomInt(min, max) {
  	return Math.floor(Math.random() * (max - min)) + min;
}

function generateName(){
	var name1 = ['raging', 'mad', 'hashing', 'cool', 'rich', 'honorable', 'king',
    'fast', 'killer', 'sweet'];

	var name2 = ['cromulon', 'computer', 'hasher', 'PC', 'rig', 'miner', 'otter',
   'cronenberg', 'gazorpazorp'];

	var name = name1[Math.floor(Math.random() * name1.length)].toLowerCase() + '-' + name2[Math.floor(Math.random() * name2.length)].toLowerCase();
	return name;

}
