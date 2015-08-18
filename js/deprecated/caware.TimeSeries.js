var DateZero = new Date (2013, 0, 1, 0, 0, 0, 0);
var viewrange;
var segmentSuffixes;
var carbon;
var emptyTimeSeries = {"start": 0,
	      "step": 1,
	      "readings" : []};

function fetchTimeSeriesSeg (urlStem, segSuf){ // Fetch data from cache or via JSON request :: Dependencies: [ui, cache], arguments: [urlStem, segSuf], globals: [emptyTimeSeries, ui]
    var tmpURL = urlStem + segSuf + ".json";
    var tempJSON = null;
    var returnObj = new Object();
    tempJSON = ui.catchError(ui, cache.getObject, tmpURL);
    if (tempJSON !== undefined) {
    	if (tempJSON.hasOwnProperty ("data")) { 
	  returnObj.result = tempJSON.data;
    	}
    } else {
	  returnObj.error = true;
    }
    return returnObj;
}

function CopyTimeSeries (ts){ // Duplicate a time series :: Dependencies: null, arguments: [ts], globals: null
    return {start: ts.start, step: ts.step, readings : ts.readings.slice(0)}
}

function ConcatTimeSeries (seg1, seg2) { // Concatenate two time series :: Dependencies: null, arguments: [seg1, seg2], globals: [emptyTimeSeries]
    
    var concat = new Object();

    if (seg1.readings.length == 0 && seg2.readings.length != 0) {
      concat = _.clone(seg2);
    } else if (seg2.readings.length == 0 && seg1.readings.length != 0) {
      concat = _.clone(seg1);
    } else if (seg1.readings.length == 0 && seg2.readings.length == 0) {
      concat = emptyTimeSeries;
    } else {
      var end = seg1.start + seg1.step * seg1.readings.length;
      var start = seg2.start;
      if (end == start && seg1.step == seg2.step) {
	concat = { "start" : seg1.start,
		   "step" : seg1.step,
		   "readings" : seg1.readings.concat(seg2.readings)
	};
      } else {
	if (seg1.step != seg2.step) {
	  // handle different timestep
	  console.log("Different timestep");
	}
	if (end != start) {
	  console.log("Data is missing");
	  var extra = new Array();
	  var diff = (start - end) / seg1.step;
	  for (diff; diff > 0; diff--) extra.push(-1);
	  if (new Date(end).getHours() < 23) {
	    concat = { "start" : seg1.start,
			"step" : seg1.step,
			"readings" : seg1.readings.concat(extra).concat(seg2.readings)
	    };
	  } else if (new Date(seg1.start).getHours() != 0) {
	    concat = { "start" : seg1.start,
			"step" : seg1.step,
			"readings" : extra.concat(seg1.readings).concat(seg2.readings)
	    };
	  } else {
	    // Handle data missing in the middle: impossible wihout timestamp
	    console.error("Data is probably missing in the middle of the file. Can't find out without per-reading timestamp.")
	  }
	}
      }
    }
    
    return concat;
}

function initMeterReadings() { // Initialize some globals :: Dependencies: [getViewRangeMonths, loadNewCarbon], arguments: null, globals: [viewrange, segmentSuffixes, carbon]
    viewrange = {"startdate": new Date(), "enddate": new Date()};
    segmentSuffixes = getViewRangeMonths (viewrange);
    carbon = emptyTimeSeries;
    loadNewCarbon();
} 

function changeRange(months) { // Add or subtract limiting months from the range :: Dependencies: [getViewRangeMonths, loadNeeded, findNeeded. plotPlotLines, loadNewCarbon], arguments: [months], globals: [viewrange, plotLineDesc, meterReadings]
  
	var oldStartYear = viewrange.startdate.getFullYear();
        if (viewrange.enddate.isBefore(viewrange.startdate.clone().addMonths(months))) return; // Make sure range remains consistent
	viewrange.startdate.addMonths(months)
	if (oldStartYear != viewrange.startdate.getFullYear()){
		loadNewCarbon();
	}
        segmentSuffixes = getViewRangeMonths(viewrange);
        for (var i=0; i<plotLineDesc.length; i++) plotLineDesc[i].valid = false;
        for (var k in meterReadings) if (meterReadings.hasOwnProperty(k)) meterReadings[k].valid = false;
        loadNeeded(findNeeded(plotLineDesc)); 
        plotPlotLines();
}

function backTrackMonth(){ // Shift range back by one month :: Dependencies: [changeRange], arguments: null, globals: [DateZero, viewrange]
    if (viewrange.enddate < DateZero) return;
    viewrange.enddate.addMonths(-1);
    changeRange(-1);
}

function advanceMonth (date) { // Increase date by one month
  console.log("advanceMonth");
    date.setMonth (date.getMonth()+1);
}

function getLastPathComponent (url) { // Get last part of URL after last slash
  console.log("getLastPathComponent");
        var comps = url.split("/");
        return comps[comps.length - 1];
}
        
function getViewRangeMonths (viewrange){ // Create suffixes for JSON requests :: Dependencies: [zero], arguments: null, globals: viewrange
    
    //* Produce an array of month segment suffixes for the viewrange
    
    var runningDate = new Date(viewrange.startdate);
    var monthStr;
    var yearStr; 
    var outputarray = new Array();
    var loopLimit = 200;
    var monthString = new String();
    for (var i=0;i<loopLimit;i++){
        if (runningDate > viewrange.enddate) break;
        yearStr = runningDate.getFullYear().toString();
        monthStr = zero(runningDate.getMonth()+1);
        outputarray.push({"year" : yearStr, "month" : monthStr});
        runningDate.addMonths(1);
    }
    return outputarray;
}

function PreviousMonth (timeStamp) { // Produce a suffix of the month previous to timestamp
    var dateStamp = new Date (timeStamp);
    dateStamp.addMonths (-1);
    return dateStamp.getFullYear().toString() + "-" + zero(dateStamp.getMonth() + 1);
}

function sameMonth (timeStamp, d) { // Check whether a timestamp and a date are in the same month
    var tsDate = new Date (timeStamp);
    return (tsDate.getFullYear() === d.getFullYear()) && (tsDate.getMonth() === d.getMonth());
}

function ensureTimeInterval (meter) { // Create meter data :: Dependencies: [ConcatTimeSeries, fetchTimeSeriesSeg], arguments: [meter, segmentSuffixes], globals: [null]
    // check start and end time for the meter
    // against the view interval
    var ts;
    meter.data.readings = []; // Reset meter readings to allow for range contraction
    if (meter.data.readings.length === 0){
	for (var i = 0 ; i<segmentSuffixes.length; i++) {
	    ts = fetchTimeSeriesSeg (meter.urlDir, segmentSuffixes[i].year + "-" + segmentSuffixes[i].month);
	    if (ts.error)
		ts = emptyTimeSeries;
	    else
		ts = ts.result;
	    // Make sure data is available for all days in the month, if not fill empty spaces with -1 so as to trigger "bad" in plotPlotLines
	    if (i != segmentSuffixes.length - 1 && ts.readings.length < 24 * Date.getDaysInMonth(segmentSuffixes[i].year, parseInt(segmentSuffixes[i].month) - 1)) {
		console.log("Data correction");
		while (ts.readings.length < 24 * Date.getDaysInMonth(segmentSuffixes[i].year, parseInt(segmentSuffixes[i].month) - 1)) ts.readings.push(-1);
	    }
	    if (ts !== null) {
	        meter.data = ConcatTimeSeries(meter.data, ts);
	    }
	}
	return meter.data.readings.length == 0 ? false : true;
    }

    // Append data until the whole viewrange is filled :: TO BE REMOVED? never triggered as meter readings always start from empty and segment suffixes fill the whole range
//     while (!sameMonth (meter.data.start, viewrange.startdate)) {
// 	console.log("while");
// 	ts = fetchTimeSeriesSeg (meter.urlDir, PreviousMonth (meter.data.start)   );
// 	if (ts.readings.length <= 0) break;
// 	meter.data = ConcatTimeSeries (ts, meter.data);
//     }
}
 
function loadNeeded (needed) { // Get meter data if missing :: Dependencies: [ensureTimeInterval], arguments: [needed, meterReadings], globals: [config]
    
   var returnObj = new Object();
   returnObj.result = new Array();

   for (var i=0; i<needed.length; i++){
        var m = needed[i];
        if (!meterReadings.hasOwnProperty (m)){
	    var path = config.sensorRootUrl.value + "/" + m  + "/" + m + "-";  // Base path, 
	    meterReadings[m] = {"urlDir": path, "valid": false, "data" : emptyTimeSeries};
        }
	returnObj.result[i] = ensureTimeInterval (meterReadings[m]);
    }
    console.log(returnObj);
    return returnObj;
}

function getViewRangeCarbonYears(viewrange){

    //* Produce an array of annual segment suffixes for the viewrange

    var outputarray = [];

    var startYear = viewrange.startdate.getFullYear();
    var endYear = viewrange.enddate.getFullYear();

    for (var y=startYear; y<=endYear; y++){
        outputarray.push(y.toString());
    }

    return outputarray;
}

function Carbonate(x, y){
    if (!carbonOn) return y;

    // Find the carbon intensity for this time


    var start = carbon.start;
    var step = carbon.step;
    var offset = (x - carbon.start)/carbon.step;

    if ((offset >= 0) && (offset < carbon.readings.length)){
    	// grams of CO2/kWHr * kW -> g/s : divide by 3600   
   	return y * carbon.readings[offset] / 3600;    
    }
    return -1;
}

function loadNewCarbon(){

    // Add the earliest year required to what we have.

    var carbonSuffixes = getViewRangeCarbonYears(viewrange);
    var seg = fetchTimeSeriesSeg (config.carbonRootUrl.value, carbonSuffixes[0]).result;
    carbon = ConcatTimeSeries (seg, carbon);
    
}