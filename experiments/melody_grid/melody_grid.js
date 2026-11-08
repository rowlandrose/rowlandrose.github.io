$(function()
{
	function indicator_move()
	{
		var next_pos;

		if(indicator_pos == 16) {
			next_pos = 1;
		} else {
			next_pos = indicator_pos + 1;
		}

		$('#melody_grid > table.indicator td.ind_' + indicator_pos).toggleClass('here');
		$('#melody_grid > table.indicator td.ind_' + next_pos).toggleClass('here');

		indicator_pos = next_pos;
	}

	/*T('interval', {interval:timbre.timevalue("bpm120 l8")}, function(){
		indicator_move();
	}).start();*/

	var ind_interval = window.setInterval(indicator_move, 250);

	var mgrid = generate_melody_grid('#melody_grid', 16, 24, 120);

	$('#melody_grid > table.grid td').click(function(){
		var col = parseInt($(this).attr('class').slice(4));
		var row = parseInt($(this).attr('title').slice(4));
		if(mgrid[row - 1][col - 1] == 0) {
			mgrid[row - 1][col - 1] = 1;
		} else {
			mgrid[row - 1][col - 1] = 0;
		}
		$(this).toggleClass('note');

		create_and_play_track( grid_to_chords( mgrid ) );
	});
});

var indicator_pos = 0; // Out of 16

var chords  = [
	[69], [69, 76, 72], [69, 76, 72], [65, 75, 71],
	[69, 76, 72], [69, 72], [69, 76, 72], [65, 75, 71],
	[59, 50, 52], [76, 72], [69, 76, 72], [65, 75, 71],
	[52], [76, 72, 54], [71, 72], [59, 71, 71]
];

function generate_melody_grid( target, width, height, bpm )
{
	$grid = $(target);
	var html = '';

	// Create grid in html
	html += '<table class="grid">';

	for(var row = 1; row <= height; row++)
	{
		html += '<tr>';

		for(var col = 1; col <= width; col++)
		{
			html += '<td class="col_' + col + '" title="row_' + row + '"></td>';
		}

		html += '</tr>';
	}

	$grid.append(html);

	// Add indicator grid
	html = '<table class="indicator"><tr>';
	for(var col = 1; col <= width; col++)
	{
		html += '<td class="ind_' + col + '"></td>';
	}
	html += '</tr></table>';

	$grid.append(html);

	// Return empty array grid
	var mgrid = [];

	for(var row = 0; row < height; row++) {
		mgrid[row] = [];
		for(var col = 0; col < width; col++) {
			mgrid[row][col] = 0;
		}
	}

	return mgrid;
}

function grid_to_chords( mgrid )
{
	var chords = [];
	for(var col = 0; col < mgrid[1].length; col++) {
		chords[col] = [];
		for(var row = 0; row < mgrid.length; row++) {
			if(mgrid[row][col] == 1) {
				chords[col].push(80 - row);
			}
		}
	}
	return chords;
}

function get_current_chords( chords, indicator_pos )
{
	if(indicator_pos > 1) {
		return chords.slice(indicator_pos).concat(chords.slice(0, indicator_pos));
	} else {
		return chords;
	}
}

function create_and_play_track( chords )
{
	T.pause();
	timbre.rec(function(output)
	{
		var current_chords = get_current_chords(chords, indicator_pos);
		var msec  = timbre.timevalue("bpm120 l8");
		var synth = T("OscGen", {env:T("perc", {r:msec, ar:true})});

		T("interval", {interval:msec}, function(count) {
			if (count < current_chords.length) {
				current_chords[count].forEach(function(i) {
					synth.noteOn(i, 100); 
				});
			} else {
				output.done();
			}
		}).start();

		output.send(synth);

	}).then(function(result)
	{
		var L = T("buffer", {buffer:result, loop:true});
		var R = T("buffer", {buffer:result, loop:true});

		var num = 400;
		var duration = L.duration;

		R.pitch = (duration * (num - 1)) / (duration * num);

		T("delay", {time:"bpm120 l16", fb:0.1, cross:true},
		T("pan", {pos:-0.6}, L), T("pan", {pos:+0.6}, R)
		).play();
	});
}