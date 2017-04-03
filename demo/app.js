var pG = {

	pathData: 'http://estaticos.lab.eldiario.es/estaticos/plantaciones/',
	pathPaises: 'paisesTot.json',
	pathQuery: '?mls3',

	act:{
		year: 2014,
		prod: 'cafe',
		type: ['imp', 'exp'],
	},

	breakPoint: 800,
	breakPointClass: 'fullGraph',
	breakPointSmallScreen: null,

	maxCircProp: 25, // relation winWidth to maxCircProp
	maxCirc: null, // generated max circle size 
	maxLineProp: 70,
	maxLine: null,

	minLineProp: 10, // relation of max circ
	minLine: null,
	minCircProp: 15, // relation of max circ
	minCirc: null,

	maxWidthText: 13,
	maxWidthTextMovil: 11,

	textYOffsetMovil: 3,
	textYOffset: 5,

	initYear: 1995,
	lastYear: 2014,

	graphsElms: 5,

	viz: {
		width: 0,
		height: 0,

		$wrap: '#pG',
		$elm: '#viz',
		svg: null,

		projection: null,
		path: null,
		map: null,
		circImp: null,
		circExp: null,
		texts: null,
		force: null,
		scale: {
			circImp: null,
			circExp: null,
			circImpExp: null,
			lines: null,
		}
	},

	data: {
		countries: null, // datos reales
		
		yearTopExp: null, // calculo de tops del año activo
		yearTopImp: null,

		totalExp: null,
		totalImp: null,
	},

	txt: {
		articulos: {
			cafe: 'el café',
			aceite: 'el aceite de palma',
			cacao: 'el cacao',
			banana: 'el banano',
			azucar: 'el azúcar'
		},

		productos: {
			cafe: 'café',
			aceite: 'aceite de palma',
			cacao: 'cacao',
			banana: 'banano',
			azucar: 'azúcar'
		}
	},

	init: function() {

		pG.viz.svg = d3.select(pG.viz.$elm);
		pG.viz.$elm = $(pG.viz.$elm);
		pG.viz.$wrap = $(pG.viz.$wrap);

		pG.countryPop.init();

		pG.tools.initJqueries();

		$(window).bind('orientationchange resize', throttle(pG.tools.handleResize, 300)).resize();
	},

	tools: {

		handleResize: function() {
			pG.tools.loadCountries();
			pG.tools.updateProjection();
			pG.tools.update();
		},

		updateProjection: function() {

			pG.viz.width = $(window).width();
			pG.viz.height = pG.viz.width / 2;
			
			if(pG.viz.width < pG.breakPoint) {
				$('#blur').remove();
				
				pG.viz.height = pG.viz.width / 1.4;
				pG.viz.$wrap.removeClass(pG.breakPointClass);
				pG.breakPointSmallScreen = true;

			} else {
				pG.viz.$wrap.addClass(pG.breakPointClass);

				pG.viz.width = pG.viz.width - 300;
				pG.viz.height = pG.viz.width / 2;

				pG.breakPointSmallScreen = false;
			}

			pG.viz.$elm.css({
				width: pG.viz.width,
				height: pG.viz.height
			});

			pG.viz.projection = d3.geoMercator()
				.scale(170 * (pG.viz.width / 1000))
				.translate([(pG.viz.width / 2) - (pG.viz.width / 14), (pG.viz.height / 2) + (pG.viz.height / 5)])
				.precision(51);

			pG.viz.path = d3.geoPath().projection(pG.viz.projection);

			if(pG.data.prod)
				for (var i = 0; i < pG.data.prod.length; i++) {
					pG.data.prod[i].x = pG.viz.projection([pG.data.prod[i].lon, pG.data.prod[i].lat])[0];
					pG.data.prod[i].y = pG.viz.projection([pG.data.prod[i].lon, pG.data.prod[i].lat])[1];
				}

			pG.maxCirc = parseInt(pG.viz.width / pG.maxCircProp, 10);
			pG.minCirc = Math.ceil(pG.maxCirc / pG.minCircProp);
			pG.maxLine = parseInt(pG.viz.width / pG.maxLineProp, 10);
			pG.minLine = pG.maxLine / pG.minLineProp;

		},

		loadCountries: function(cb) {

			d3.json(pG.pathData + pG.pathPaises + pG.pathQuery, function(error, world) {
				
				if (error) throw error;

				var paises = [];
				var autoComplete = [];

				for (var key in world) {
				  if (world.hasOwnProperty(key)) {

					var pais = world[key];

					pais.key = key;
					pais.posX = pG.viz.projection([pais.lon, pais.lat])[0];
					pais.posY = pG.viz.projection([pais.lon, pais.lat])[1];
					pais.x = pais.posX;
					pais.y = pais.posY;

					paises.push(pais);

					if(pais.x && pais.y) { // limita paises chungos

						autoComplete.push({
							value: pais.name,
							data: {
								id: pais.name,
								key: pais.key
							}
						});

					}

				  }
				}
				
				$('#countryImput').autocomplete({
				  lookup: autoComplete,
				  minChars: 3,
				  orientation: 'bottom',
				  autoSelectFirst: true,
				  showNoSuggestionNotice: true,
				  // appendTo: '#searchResults',
				  noSuggestionNotice: 'No se encontraron coincidencias',
				  groupBy: 'p',
				  onSelect: function (suggestion) {
					pG.countryPop.activa(suggestion.data.key);
				  }
				});

				pG.data.countries = paises;
				
				if(cb) cb();
			});
		},

		update: function() {
			d3.json(pG.pathData + pG.act.prod + '.json' + pG.pathQuery, function(error, data){
				
				if (error) throw error;

					// si no hay paises los carga asyncronos
				if(!pG.data.countries) pG.tools.loadCountries(function(){
					
					pG.tools.processData(data);

					return;
				});

				pG.tools.processData(data);

				pG.countryPop.update();

			});
		},

		getCountry: function(key) {
			for (var i = 0; i < pG.data.countries.length; i++) {
				if(pG.data.countries[i].key == key) return pG.data.countries[i];
			}
			return false;
		},

		getdataCountry: function(country) {
			d3.json(pG.pathData + pG.act.prod + '.json' + pG.pathQuery, function(error, data){
				if (error) throw error;

				var dataCountry = {
					actCountry: null,
					expByYear: [],
					impByYear: [],
				};
				if(pG.act.type.length == 1) {

						// exportaciones
					if(pG.act.type.indexOf('exp') != -1) {
						var exprts = [];

						for(var exp in data[pG.act.year][country]) {
							if(data[pG.act.year][country].hasOwnProperty(exp)) {

								exprts.push({
									key: exp,
									val: data[pG.act.year][country][exp]
								});
							}
						}
						
						exprts.sort(function(x, y){
							return d3.descending(x.val, y.val);
						});

						dataCountry.exports = fixArrTop(exprts.slice(0, 5));
					}

						// importaciones
					if(pG.act.type.indexOf('imp') != -1) {
						var imprts = [];

						for(var imp in data[pG.act.year]) {
							if(data[pG.act.year].hasOwnProperty(imp)) {
								if(data[pG.act.year][imp][country])
									imprts.push({
										key: imp,
										val: data[pG.act.year][imp][country]
									});
							}
						}
						
						imprts.sort(function(x, y){
							return d3.descending(x.val, y.val);
						});

						dataCountry.imports = fixArrTop(imprts.slice(0, 5));

					}
				}
					// apaña el array para formatearlo como los otroso tops
				function fixArrTop (array) {
					var outp = [];
					for (var i = 0; i < array.length; i++) {
						outp.push({
							data: {
								name: pG.tools.getCountry(array[i].key).name,
								key: array[i].key,
								val: array[i].val
							},
							pos: i
						});
					}
					return outp;
				}

				for (var i = pG.data.countries.length - 1; i >= 0; i--) {
					if(pG.data.countries[i].key == country) dataCountry.actCountry = pG.data.countries[i];
				}
				if(!dataCountry.actCountry) throw 'No se encontró el pais activo';

				for(var year = pG.initYear; year <= pG.lastYear; year++) {

					dataCountry.expByYear[year] = 0;
					dataCountry.impByYear[year] = 0;

					for (var i = pG.data.countries.length - 1; i >= 0; i--) {
						if(pG.data.countries[i].key == country) {
							for (var k = pG.data.countries.length - 1; k >= 0; k--) {
								if(data[year][country] && data[year][country][pG.data.countries[k].key]) dataCountry.impByYear[year] += data[year][country][pG.data.countries[k].key];
							}
						} else if (data[year][pG.data.countries[i].key] && data[year][pG.data.countries[i].key][country]) {
							dataCountry.expByYear[year] += data[year][pG.data.countries[i].key][country];
						}
					}

				}

				pG.countryPop.draw(dataCountry);

			});
		},

		getTop: function(country, type) {
			
			var top = [];
			var topCountries = type == 'imp' ? pG.data.yearTopImp : pG.data.yearTopExp;
			var found = false;

			for (var i = 0; i < pG.graphsElms; i++) {
				
				if(topCountries[i].key == country) {
					found = true;
				}

				top.push({
					data: topCountries[i],
					pos: i
				});

			}

			if(found) return top;

			for (var i = topCountries.length - 1; i >= 0; i--) {
				if(topCountries[i].key == country) {
					
					top.push({
						data: topCountries[i],
						pos: i
					});

					return top;
				}
			}

		},

		getFrases: function(dataCountry) {

			var name = dataCountry.actCountry.name;
			var out = [];

			if(pG.act.type.length == 2) {

				var balance = dataCountry.actCountry.totalExp - dataCountry.actCountry.totalImp;
				var positionImp = pG.tools.getPosition(dataCountry, 'imp');
				var positionExp = pG.tools.getPosition(dataCountry, 'exp');

				if(balance > 0) {
					out.push('<strong>' + name + '</strong> exportó <strong>' + pG.tools.parseAmmount(balance) + ' más</strong> en <strong>' + pG.txt.productos[pG.act.prod] + '</strong> de los que importó.');
				} else {
					out.push('<strong>' + name + '</strong> importó <strong>' + pG.tools.parseAmmount(-1 * balance) + ' más</strong> en <strong>' + pG.txt.productos[pG.act.prod] + '</strong> de los que exportó.');
				}
				out.push('<strong>' + name + '</strong> ocupa el puesto número <strong>' + positionExp + '</strong> de países exportadores y el puesto número <strong>' + positionImp + '</strong> de paises importadores de <strong>' + pG.txt.productos[pG.act.prod] + '</strong>.');


			} else if(pG.act.type.indexOf('imp') != -1) {

				var posImp = pG.tools.fixPosition(pG.tools.getPosition(dataCountry, 'imp'));
				var percImp = 100 * dataCountry.actCountry.totalImp / pG.data.totalImp;
				var totImp = 100 * dataCountry.actCountry.totalImp / dataCountry.actCountry.resumen.imps[pG.act.year];

				out.push('<strong>' + name + '</strong> ocupa el <strong>' + posImp + ' puesto</strong> en el ranking de países importadores de <strong>' + pG.txt.productos[pG.act.prod] + '</strong>.');
				out.push('<strong>' + name + '</strong> controla el <strong>' + percImp.toFixed(1).replace('.', ',') + '%</strong> de las importaciones mundiales de <strong>' + pG.txt.productos[pG.act.prod] + '</strong>.');
				out.push('<strong>' + firstCapital(pG.txt.articulos[pG.act.prod]) + '</strong> supone el ' + totImp.toFixed(1).replace('.', ',') + '% de las importaciones de <strong>' + name +  '</strong>, ' + pG.tools.parseAmmount(dataCountry.actCountry.totalImp) + '</strong>.');

			} else {

				var posExp = pG.tools.fixPosition(pG.tools.getPosition(dataCountry, 'exp'));
				var percExp = 100 * dataCountry.actCountry.totalExp / pG.data.totalExp;
				var totExp = 100 * dataCountry.actCountry.totalExp / dataCountry.actCountry.resumen.exps[pG.act.year];

				out.push('<strong>' + name + '</strong> ocupa el <strong>' + posExp + ' puesto</strong> en el ranking de países exportadores de <strong>' + pG.txt.productos[pG.act.prod] + '</strong>.');
				out.push('<strong>' + name + '</strong> controla el <strong>' + percExp.toFixed(1).replace('.', ',') + '%</strong> de las exportaciones mundiales de <strong>' + pG.txt.productos[pG.act.prod] + '</strong>.');
				out.push('<strong>' + firstCapital(pG.txt.articulos[pG.act.prod]) + '</strong> supone el ' + totExp.toFixed(1).replace('.', ',') + '% de las exportaciones de <strong>' + name +  '</strong>, ' + pG.tools.parseAmmount(dataCountry.actCountry.totalExp) + '.');
			}

			return out;
		},

		parseAmmount: function(ammout) {
			if(ammout / 1000000 > 1) {
				return numberThousandsDots(Math.round(ammout / 1000000)) + ' millones de dólares';
			} else {
				return numberThousandsDots(ammout) + ' dólares';
			}
		},

		fixPosition: function (number) {
			switch(number){
				case 1: return 'primer'; break;
				case 2: return 'segundo'; break;
				case 3: return 'tercer'; break;
				default: return number + 'º'; break;
			}
		},

		getPosition: function (dataCountry, type) {
			if(type == 'imp') {
				for (var i = pG.data.yearTopImp.length - 1; i >= 0; i--) {
					if(pG.data.yearTopImp[i].key == dataCountry.actCountry.key) return i + 1;
				}
			} else {
				for (var i = pG.data.yearTopExp.length - 1; i >= 0; i--) {
					if(pG.data.yearTopExp[i].key == dataCountry.actCountry.key) return i + 1;
				}
			}
			return null;
		},

		processData: function(data) {

			var countries = pG.data.countries; // alias
			var actData = data[pG.act.year];

			var links = [];
			var linksAll = [];
			var tops = {
				exp: [],
				imp: []
			};

			for (var i = countries.length - 1; i >= 0; i--) {
				countries[i].totalImp = 0;
				countries[i].totalExp = 0;
			}


			var imps = [];

			var max = 0;

			for (var i = countries.length - 1; i >= 0; i--) {
				if(actData[countries[i].key]) {

								// suma exportaciones
					for (var j = countries.length - 1; j >= 0; j--) {
						if(actData[countries[i].key][countries[j].key]) {

							var val = actData[countries[i].key][countries[j].key];

							countries[i].totalExp += val;
							countries[j].totalImp += val;

							imps.push(val);

							if(val > max) max = val;

							linksAll.push({
								source: countries[i],
								target: countries[j],
								val: val
							});

						}

					}

				}
			}

			for (var i = 0; i < linksAll.length; i++) {
				if(linksAll[i].val > max / 1000) links.push(linksAll[i]);
			}
			
			pG.data.totalExp = 0;
			pG.data.totalImp = 0;

			for (var i = countries.length - 1; i >= 0; i--) {

				pG.data.totalExp += countries[i].totalExp;
				pG.data.totalImp += countries[i].totalImp;

				tops.imp.push({
					key: countries[i].key,
					val: countries[i].totalImp,
					name: countries[i].name
				});

				tops.exp.push({
					key: countries[i].key,
					val: countries[i].totalExp,
					name: countries[i].name
				});
			}

			var maxImp = [];
			var maxExp = [];
			var maxImpExp = [];

			for (var i = countries.length - 1; i >= 0; i--) {
				if(countries[i].totalImp > 0) maxImp.push(countries[i].totalImp);
				if(countries[i].totalExp > 0) maxExp.push(countries[i].totalExp);
				if((countries[i].totalImp + countries[i].totalExp) > 0) maxImpExp.push(countries[i].totalImp + countries[i].totalExp);
			}

			pG.data.yearTopExp = tops.exp.sort(function(x, y){
				return d3.descending(x.val, y.val);
			});

			pG.data.yearTopImp = tops.imp.sort(function(x, y){
				return d3.descending(x.val, y.val);
			});

			pG.viz.scale.circImp =
				d3.scalePow().exponent(0.5).domain([0,d3.max(maxImp)]).range([0,pG.maxCirc]);
			pG.viz.scale.circExp =
				d3.scalePow().exponent(0.5).domain([0,d3.max(maxExp)]).range([0,pG.maxCirc]);
			pG.viz.scale.circImpExp =
				d3.scalePow().exponent(0.5).domain([0,d3.max(maxImpExp)]).range([0,pG.maxCirc]);
			pG.viz.scale.lines =
				d3.scalePow().exponent(0.9).domain([0,d3.max(imps)]).range([0,pG.maxLine]);

			for (var i = countries.length - 1; i >= 0; i--) {
				countries[i].rTot = pG.viz.scale.circImpExp(countries[i].totalImp + countries[i].totalExp);
				countries[i].rTotImp = pG.viz.scale.circImpExp(countries[i].totalImp);
				countries[i].rTotExp = pG.viz.scale.circImpExp(countries[i].totalExp);
				countries[i].rImp = pG.viz.scale.circImp(countries[i].totalImp);
				countries[i].rExp = pG.viz.scale.circExp(countries[i].totalExp);
			}

				// iniciación inicial de círculos y textos
			if(!pG.viz.circsImp) {

				pG.viz.links = pG.viz.svg
					.append('g').attr('class', 'linksWrap')
						.selectAll('.link').data(links).enter()
						.append('line')
							.attr('class', pG.evs.linksClass)
							.attr('stroke-width', function(d){ return pG.viz.scale.lines(d.val); })
							.on("mouseenter", pG.evs.linksEnter)
							.on("mouseout", pG.evs.circOut);

				pG.viz.circExp = pG.viz.svg
					.append('g').attr('class', 'circExpWrap')
						.selectAll('.circExp').data(countries).enter()
						.append('circle')
							.attr('class', 'circExp')
							.on("mouseenter", pG.evs.circExpEnter)
							.on("mousedown", pG.evs.circClick)
							.on("mouseout", pG.evs.circOut);

				pG.viz.circsImp = pG.viz.svg
					.append('g').attr('class', 'circImpWrap')
						.selectAll('.circImp').data(countries).enter()
						.append('circle')
							.attr('class', 'circImp')
							.on("mouseenter", pG.evs.circInEnter)
							.on("mousedown", pG.evs.circClick)
							.on("mouseout", pG.evs.circOut);

				pG.viz.texts = pG.viz.svg
					.append('g').attr('class', 'textsWrap')
						.selectAll('.text').data(countries).enter()
						.append('text')
							.attr('class', 'text')
							.text(function(d){ return d.key.toUpperCase(); });

			} else {

					// cargándonos las líenas cada vez
				pG.viz.links.remove();
				pG.viz.links = pG.viz.svg
					.select('.linksWrap')
						.selectAll('.link').data(links).enter()
						.append('line')
							.attr('class', pG.evs.linksClass)
							.attr('stroke-width', function(d){ return pG.viz.scale.lines(d.val); })
							.on("mouseenter", pG.evs.linksEnter)
							.on("mouseout", pG.evs.circOut);
			}

				// actualización de líneas
			pG.viz.links.data(links)
				.attr('stroke-width', function(d){ return pG.viz.scale.lines(d.val); })
				.attr('class', pG.evs.linksClass)
				.attr("visibility", pG.evs.linksVisibilityCheck)
				.attr('opacity', 0)
				.transition().duration(500).attr('opacity', 1);

				// actualización de círculos y textos
			pG.viz.circsImp.data(countries)
				.attr("visibility", pG.evs.circImpVisibilityCheck)
				.attr('r', pG.evs.circImpRadius)
				.attr('cx', function(d) { if(d.posX) return d.x; })
				.attr('cy', function(d) { if(d.posY) return d.y; });

			pG.viz.circExp.data(countries)
				.attr("visibility", pG.evs.circExpVisibilityCheck)
				.attr('r', pG.evs.circExpRadius)
				.attr('cx', function(d) { if(d.posX) return d.x; })
				.attr('cy', function(d) { if(d.posY) return d.y; });

			pG.viz.texts.data(countries)
				.attr("visibility", pG.evs.textVisibilityCheck)
				.attr('x', function(d) { if(d.posX) return d.x; })
				.attr('y', function(d) { if(d.posY) return d.y + (pG.breakPointSmallScreen ? 3 : 5); });

			pG.viz.force = d3.forceSimulation(countries)
				.force("link", d3.forceLink(links).strength(0.0000000000001))
				.force("collide", d3.forceCollide().radius(pG.evs.collideRadiusFn).iterations(6).strength(1.2))

				.alphaDecay(pG.breakPointSmallScreen ? 0.8 : 0.6)
				.velocityDecay(0.7)

				.on('tick', pG.tools.tick);

		},

			// each forze loop
		tick: function() {

			// console.log('tick')

			pG.viz.circsImp
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; });

			pG.viz.circExp
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; });

			pG.viz.links
				.attr('x1', function(d) { return d.source.x; })
				.attr('x2', function(d) { return d.target.x; })
				.attr('y1', function(d) { return d.source.y; })
				.attr('y2', function(d) { return d.target.y; })
				.attr('class', pG.evs.linksClass)
				.attr("visibility", pG.evs.linksVisibilityCheck);

			pG.viz.texts
				.attr('x', function(d) { return d.x; })
				.attr('y', function(d) { return d.y + (pG.breakPointSmallScreen ? pG.textYOffset : pG.textYOffset); });
			
		},

		initJqueries: function() {

			$('#years')
				.find('.gotoYear').click(pG.evs.changeYear).end()
				.find('.nextYear').click(pG.evs.nextYear).end()
				.find('.prevYear').click(pG.evs.prevYear);

			$('#prods a').click(pG.evs.changeProduct);

			$('#type a').click(pG.evs.changeType);

			// $('#years a[data-year=' +  pG.act.year + ']').addClass('act');

			$('#activeYear').html(pG.act.year);
			$('#prods a[data-prod=' +  pG.act.prod + ']').addClass('act');

			$(pG.act.type).each(function(e, f){
				$('#type a[data-type=' +  f + ']').addClass('act');
			});

			$('body')
				.delegate('#frases li', 'click', function(){
					shareTweet($(this).text().slice(0, -1) + ' en ' + pG.act.year, 'http://latierraesclava.eldiario.es/', 'latierraesclava', 'eldiarioes');
					return false;
				})
				.delegate('#searchSelected a', 'click', function(){
					pG.countryPop.hide();
					return false;
				});

		}
	},

	countryPop: {
		active: false,
		$elm: '#pop',
		$frases: '#frases',
		$graphLines: '#graphLines',
		$graphBars1: '#graphBars1',
		$graphBars2: '#graphBars2',

		init: function() {

			pG.countryPop.$elm = $(pG.countryPop.$elm);
			pG.countryPop.$frases = $(pG.countryPop.$frases);
			pG.countryPop.$graphLines = $(pG.countryPop.$graphLines).find('.inn');
			pG.countryPop.$graphBars1 = $(pG.countryPop.$graphBars1).find('.inn');
			pG.countryPop.$graphBars2 = $(pG.countryPop.$graphBars2).find('.inn');
			
			$('#closePop').click(pG.countryPop.hide);

				// clase genérica para mostrar popups
			pG.viz.$wrap
				.delegate('.activaCountry', 'click', function(e){
					e.preventDefault();

					var $elm = $(this);
					var target = $elm.data('country');

					if(!target) throw 'No se encontró el pais clickado';

					pG.countryPop.activa(target);
				})

					// clase genérica para mostrar popups
				.delegate('.activaYear', 'click', function(e){
					e.preventDefault();

					var $elm = $(this);
					var target = $elm.data('year');

					if(!target) throw 'No se encontró el año clickado';

					pG.evs.gotoYear(target);
				});
		},

		activa: function(countryKey) {
			
			pG.countryPop.clear();

			var countryData = pG.tools.getdataCountry(countryKey);
			
			pG.countryPop.active = countryKey;

			$('#searchHelp').hide();
			
			pG.viz.$wrap.addClass('actPop');

				// hasta aquí móvil
			if(pG.breakPointSmallScreen) return;

			setTimeout(function(){pG.countryPop.activaHover(countryKey); }, 100);

			d3.selectAll('feGaussianBlur').transition().attr('stdDeviation', 4);

		},

		activaHover: function(countryKey) {
			for (var i = 0; i < pG.data.countries.length; i++) {
				if (pG.data.countries[i].key == countryKey) {
					pG.evs.circsHover(pG.data.countries[i]);
					return;
				}
			}
		},

		hide: function() {
			pG.countryPop.active = null;
			pG.viz.$wrap.removeClass('actPop');
			
			pG.countryPop.clear();

				// hasta aquí móvil
			if(pG.breakPointSmallScreen) return;

			d3.selectAll('feGaussianBlur').transition().attr('stdDeviation', 0);
			
			pG.evs.circOut();

		},

		clear: function() {

			pG.countryPop.active = null;

			pG.countryPop.$frases.find('*').remove();
			pG.countryPop.$graphBars2.find('*').remove();
			pG.countryPop.$graphBars1.find('*').remove();
			pG.countryPop.$graphLines.find('*').remove();
			pG.countryPop.$graphLines.append('<svg></svg>');

			$('#searchHelp').show();
			$('#searchSelected').hide().html('');

		},

		update: function() {
			if(pG.countryPop.active) pG.countryPop.activa(pG.countryPop.active);
		},
		

		draw: function(data) {

			var frases = pG.tools.getFrases(data);
			$.each(frases, function(e, f){
				pG.countryPop.$frases.append($('<li>' + f + '<i class="fa fa-twitter" aria-hidden="true"></i></li>'));
			});

			$('#searchSelected').show().html('<a href="#" class="clearPop">' + data.actCountry.name + '</a>');

				// en móvil, hasta aquí
			if(pG.breakPointSmallScreen) return;

				// Grafiquitas
				// esta siempre:
			pG.countryPop.drawEvol(pG.countryPop.$graphLines, data);

				// Las de barras cambian según lo activado
			if(pG.act.type.length == 2) {

				pG.countryPop.drawBarras(pG.tools.getTop(data.actCountry.key, 'exp'), data, pG.countryPop.$graphBars1, 'exp');
				pG.countryPop.drawBarras(pG.tools.getTop(data.actCountry.key, 'imp'), data, pG.countryPop.$graphBars2, 'imp');

			} else if($.inArray('imp', pG.act.type) == -1) {

				pG.countryPop.drawBarras(pG.tools.getTop(data.actCountry.key, 'exp'), data, pG.countryPop.$graphBars1, 'exp');
				pG.countryPop.drawBarras(data.exports, data, pG.countryPop.$graphBars2, 'expInternal');

			} else {
				
				pG.countryPop.drawBarras(pG.tools.getTop(data.actCountry.key, 'imp'), data, pG.countryPop.$graphBars1, 'imp');
				pG.countryPop.drawBarras(data.imports, data, pG.countryPop.$graphBars2, 'impInternal');
			}
	

		},

		drawBarras: function(top, data, $elm, type) {

			switch(type) {
				case 'exp':
					$elm.addClass('graphBarsExp')
						.append('<h4 style="text-transform: uppercase">Ranking de países <br>exportadores</h4><p style="margin-bottom: 0.8em">En millones de dolares</p>');
				break;
				case 'imp':
					$elm.addClass('graphBarsImp')
						.append('<h4 style="text-transform: uppercase">Ranking de países <br>importadores</h4><p style="margin-bottom: 0.8em">En millones de dolares</p>');
				break;
				case 'expInternal':
					$elm.addClass('graphBarsImp')
						.append('<h4 style="text-transform: uppercase">Principales paises<br>a los que exporta</h4><p style="margin-bottom: 0.8em">En millones de dolares</p>');
				break;
				case 'impInternal':
					$elm.addClass('graphBarsImp')
						.append('<h4 style="text-transform: uppercase">Principales paises<br>de los que importa</h4><p style="margin-bottom: 0.8em">En millones de dolares</p>');
				break;
			}

			var max = d3.max(top, function(e){ return e.data.val; });

			$.each(top, function(e, f){
				
				if(e == pG.graphsElms) pG.countryPop.$graphBars1.append('<li>....</li>');
				
				var $bar = null;
				if(type == 'exp' || type == 'imp') {
					$bar = $('<li><a data-toggle="tooltip" href="#" class="activaCountry' + (f.data.key == data.actCountry.key ? ' activeBar' : '' ) +'" data-country="' + f.data.key + '"><span class="key">' + f.data.key + '</span><div class="bar" title="' + f.data.name + ((type == 'imp') ? ' importó ' : ' exportó ') + pG.tools.parseAmmount(f.data.val) + ' de ' + pG.txt.productos[pG.act.prod] + ' en ' + pG.act.year + '" data-width=""><span class="text">' + millionsParser(f.data.val) + '</span></div></a></li>');
				} else {
					$bar = $('<li><a data-toggle="tooltip" href="#" class="activaCountry' + (f.data.key == data.actCountry.key ? ' activeBar' : '' ) +'" data-country="' + f.data.key + '"><span class="key">' + f.data.key + '</span><div class="bar" title="' + data.actCountry.name + ((type == 'impInternal') ? ' importó ' : ' exportó ') + pG.tools.parseAmmount(f.data.val) + ' de ' + pG.txt.productos[pG.act.prod] + ((type == 'impInternal') ? ' de ' : ' a ') + f.data.name + ' en ' + pG.act.year + '" data-width=""><span class="text">' + millionsParser(f.data.val) + '</span></div></a></li>');
				}
				
				$elm.append($bar);

				var val = f.data.val * 100 / max;

				$bar.find('.bar').tooltip();
				$bar.find('.bar').stop(false, false).css('width', 0).animate({'width': val}, 1000);
				if(val < 40) $bar.find('.bar').addClass('bar-left');

			});
		},


		drawEvol: function($elm, data) {
			
				// gráfico de evolucion
			$elm.prepend('<h4 style="text-transform: uppercase">Evolución importaciones y exportaciones de ' + pG.txt.productos[pG.act.prod] + '</h4><p style="margin-bottom: 0.8em">En millones de dolares</p>');

			var max = d3.max([
				d3.max(d3.entries(data.expByYear), function(e){ return parseInt(e.value, 10); }),
				d3.max(d3.entries(data.impByYear), function(e){ return parseInt(e.value, 10); })
			]);

			var padding = 30;
			var paddingV = 5;

			var width = 210;
			var height = width * 0.6;
			var scale = d3
				.scaleLinear()
				.domain([0, max])
				.range([height, 0]);
			
			var axis = d3
				.axisLeft(scale)
					.ticks(4)
					.tickSize(0)
					.tickFormat(function(d) { return parseInt(d / 1000000, 10);});

			var years = pG.lastYear - pG.initYear;
			var jump = (width - padding) / years;

			var tmpPath = 'M' + padding + ' ' + (height + paddingV) + ' L';
			var tmpPathLine = 'M';
			var finalImpPath = 'M' + padding + ' ' + (height + paddingV) + ' L';
			var finalImpLine = 'M';
			var finalExpPath = 'M' + padding + ' ' + (height + paddingV) + ' L';
			var finalExpLine = 'M';

			var graph = d3.select($elm.find('svg')[0])
				.attr('width', width + 3).attr('height', height + (2 * paddingV));

			graph.append('g')
				.attr('transform', 'translate(' + (padding - 5) + ' ,' + paddingV + ')')
				.attr('class', 'axes')
				.call(axis);

			var lines = graph.append('g').attr('class', 'lines');
			var dots = graph.append('g').attr('class', 'dots');

			for (var i = 0; i <= years; i++) {
				
				var Px = padding + (jump * i);
				var PyExp = paddingV + scale(data.expByYear[pG.initYear + i]);
				var PyImp = paddingV + scale(data.impByYear[pG.initYear + i]);

				tmpPath += Px + ' ' + (height + paddingV) + ' L';
				tmpPathLine += Px + ' ' + (height + paddingV) + ' L';
				finalImpPath += Px + ' ' + PyImp + ' L';
				finalImpLine += Px + ' ' + PyImp + ' L';
				finalExpPath += Px + ' ' + PyExp + ' L';
				finalExpLine += Px + ' ' + PyExp + ' L';

				dots.append('circle')
					.attr('class', 'circLinesWhite')
					.attr('cx', Px)
					.attr('cy', PyExp)
					.attr('r', 4)
					.attr('opacity', 0)
					.transition().duration(2000).attr('opacity', 1);

				dots.append('circle')
					.on("mouseenter", pG.evs.circGraphTooltip)
					.on("mouseout", pG.evs.circGraphTooltipOut)
					.attr('class', 'circLines linesExp activaYear' + (pG.initYear + i == pG.act.year ? ' linesExpFill' : '') )
					.attr('data-year', pG.initYear + i)
					.attr('cx', Px)
					.attr('cy', PyExp)
					.attr('r', 3)
					.attr('stroke', '#126567')
					.attr('title', data.actCountry.name + ' importó ' + pG.tools.parseAmmount(data.expByYear[pG.initYear + i]) + ' de ' + pG.txt.productos[pG.act.prod] + ' en ' + (pG.initYear + i) + '.')
					.attr('opacity', 0)
					.transition().duration(2000).attr('opacity', 1);

				dots.append('circle')
					.attr('class', 'circLinesWhite')
					.attr('cx', Px)
					.attr('cy', PyImp)
					.attr('r', 4)
					.attr('opacity', 0)
					.transition().duration(2000).attr('opacity', 1);

				dots.append('circle')
					.on("mouseenter", pG.evs.circGraphTooltip)
					.on("mouseout", pG.evs.circGraphTooltipOut)
					.attr('class', 'circLines linesImp activaYear' + (pG.initYear + i == pG.act.year ? ' linesImpFill' : ''))
					.attr('data-year', pG.initYear + i)
					.attr('cx', Px)
					.attr('cy', PyImp)
					.attr('r', 3)
					.attr('title', data.actCountry.name + ' exportó ' + pG.tools.parseAmmount(data.impByYear[pG.initYear + i]) + ' de ' + pG.txt.productos[pG.act.prod] + ' en ' + (pG.initYear + i) + '.')
					.attr('opacity', 0)
					.transition().duration(2000).attr('opacity', 1);
			}

			tmpPath += (padding + width) + ' ' + (height + paddingV) + ' L' +  padding + ' 0 Z';
			finalImpPath += (padding + width) + ' ' + (height + paddingV) + ' Z';
			finalExpPath += (padding + width) + ' ' + (height + paddingV) + ' Z';

			lines.append('path')
					.attr('d', tmpPath)
					.attr('stroke', 'none')
					.attr('fill', 'rgba(211, 93, 51, 0.1)')
						.transition().duration(1000)
							.attr('d', finalImpPath);

			lines.append('path')
					.attr('d', tmpPath)
					.attr('stroke', 'none')
					.attr('fill', 'rgba(150, 203, 81, 0.1)')
						.transition().duration(1000)
							.attr('d', finalExpPath);

			lines.append('path')
					.attr('d', tmpPathLine.slice(0, -1))
					.attr('stroke', 'rgb(211, 93, 51)')
					.attr('stroke-width', '1')
					.attr('fill', 'none')
						.transition().duration(1000)
							.attr('d', finalImpLine.slice(0, -1));

			lines.append('path')
					.attr('d', tmpPathLine.slice(0, -1))
					.attr('stroke', '#126567')
					.attr('stroke-width', '1')
					.attr('fill', 'none')
						.transition().duration(1000)
							.attr('d', finalExpLine.slice(0, -1));
		},
	},

	evs: { // pG.evs.circInEnter

		circGraphTooltipOut: function() {
			$('#pop .tooltip').remove();
		},

		circGraphTooltip: function(e, f) {

			var $this = $(this);
			var $wrap = $('#pop');
			var posX = $this.offset().left - $wrap.offset().left;
			var posY = $wrap.height() - ($this.offset().top - $wrap.offset().top);
			
			var $tooltip = $('<div class="tooltip top" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + $this.attr('title') + '</div></div>');
			
			$tooltip.css({ bottom: posY, left: posX - 98});
			$wrap.append($tooltip);
			$tooltip.animate({opacity: 1}, 400);

		},

		circTooltip: function(d) {

			var posY = d.y;
			var posX = d.x - 100;
			var textoTT = '';
			
			if(pG.act.type.length == 2) {
				textoTT = '<strong>' + d.name + '</strong> exportó ' + pG.tools.parseAmmount(d.totalExp) + ' e importó ' + pG.tools.parseAmmount(d.totalImp) + ' de <strong>' + pG.txt.productos[pG.act.prod] + '</strong> en ' + pG.act.year;
				posY -= (d.rTot + 4);
			} else {
				if(pG.act.type.indexOf('exp') != -1) {
					textoTT = '<strong>' + d.name + '</strong> exportó ' + pG.tools.parseAmmount(d.totalExp) + ' de <strong>' + pG.txt.productos[pG.act.prod] + '</strong> en ' + pG.act.year;
					posY -= (d.rExp + 4);
				} else {
					textoTT = '<strong>' + d.name + '</strong> importó ' + pG.tools.parseAmmount(d.totalImp) + ' de <strong>' + pG.txt.productos[pG.act.prod] + '</strong> en ' + pG.act.year;
					posY -= (d.rImp + 4);
				}
			}

			posY = $('#graph').height() - posY;
			
			var $tooltip = $('<div class="tooltip top" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + textoTT + '</div></div>');

			$tooltip.css({ bottom: posY, left: posX, }).appendTo('#graph');
			$tooltip.animate({opacity: 1}, 400);


		},

		linksClass: function(d) {
			return (d.source.x > d.target.x ? 'link' : 'link link-left');
		},

		linksEnter: function(d) {

			if(pG.breakPointSmallScreen) return false;

			pG.evs.linesHover(d);
			pG.evs.linesTooltip(d);

		},

		linesHover: function(d) {
			$('#graph').addClass('hover');

			pG.viz.links
				.attr('class', function(e) {
					var base = e.source.x > e.target.x ? 'link' : 'link link-left';
					return e == d ? (base + ' linkAct') : base;
				});

			pG.viz.circExp
				.attr('class', function(e) {
					return (d.target == e || d.source == e) ? 'circExp circExpAct' : 'circExp';
				});

			pG.viz.circsImp
				.attr('class', function(e) {
					return (d.target == e || d.source == e) ? 'circImp circImpAct' : 'circImp';
				});

		},
		linesTooltip: function(d) {
				// links tooltip
			var posX = ((d.source.x + d.target.x) / 2) - 100;
			var posY = ((d.source.y + d.target.y) / 2) - 5;

			var textoTT = '<strong>' + d.source.name + '</strong> exportó ' + pG.tools.parseAmmount(d.val) +  ' de <strong>' + pG.txt.productos[pG.act.prod] + '</strong> a <strong>' + d.target.name + '</strong> en ' + pG.act.year;

			posY = $('#graph').height() - posY;
			
			var $tooltip = $('<div class="tooltip top" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + textoTT + '</div></div>');
			
			$tooltip.css({ bottom: posY, left: posX, }).appendTo('#graph');
			$tooltip.animate({opacity: 1}, 400);

		},

		circsHover: function(d) {

			$('#graph').addClass('hover');

			pG.viz.circExp
				.attr('class', function(e) {
					
					if(e.key == d.key) return 'circExp circExpAct';
					
					var found = false;
					
					pG.viz.links.each(function(f){
						if((f.source.key == d.key && f.target.key == e.key) && (pG.viz.scale.lines(f.val) > pG.minLine)) found = true;
						if((f.source.key == e.key && f.target.key == d.key) && (pG.viz.scale.lines(f.val) > pG.minLine)) found = true;
					});

					return found ? 'circExp circExpAct' : 'circExp';
				});

			pG.viz.circsImp
				.attr('class', function(e) {
					
					if(e.key == d.key) return 'circImp circImpAct';

					var found = false;
					
					pG.viz.links.each(function(f){
						if((f.source.key == d.key && f.target.key == e.key) && (pG.viz.scale.lines(f.val) > pG.minLine)) found = true;
						if((f.source.key == e.key && f.target.key == d.key) && (pG.viz.scale.lines(f.val) > pG.minLine)) found = true;
					});

					return found ? 'circImp circImpAct' : 'circImp';
				});

			pG.viz.links
				.attr('class', function(e) {
					var base = e.source.x > e.target.x ? 'link' : 'link link-left';
					return (e.source.key == d.key || e.target.key == d.key) ? (base + ' linkAct') : base;
				});
		},

		circExpEnter: function(d) {

			$('#graph .tooltip').remove();

			if(pG.breakPointSmallScreen) return false;

			pG.evs.circsHover(d);
			pG.evs.circTooltip(d);

		},

		circInEnter: function(d) {
			if(pG.breakPointSmallScreen) return;
			
			pG.evs.circsHover(d);
			pG.evs.circTooltip(d);

		},

		circClick: function(d) {
			pG.countryPop.activa(d.key);
		},

		circOut: function(d){
			$('#graph .tooltip').remove();
			$('#graph').removeClass('hover');

			pG.viz.links
				.attr('class', pG.evs.linksClass);

			pG.viz.circExp
				.attr('class', 'circExp');
			pG.viz.circsImp
				.attr('class', 'circImp');
		},

		linksVisibilityCheck: function (d) {
			if(d.source.name && !d.source.posX) return "hidden";
			if(d.source.name && !d.target.posX) return "hidden";
			if(pG.act.type.length != 2) return "hidden";
			return (pG.viz.scale.lines(d.val) < pG.minLine) ? "hidden" : "visible";
		},

		textVisibilityCheck: function(d) {
			if(!d.posX) return "hidden";
			if(pG.act.type.length == 2) {
				return d.rTot < (pG.breakPointSmallScreen ? pG.maxWidthTextMovil : pG.maxWidthText) ? "hidden" : "visible";
			} else {
				if($.inArray('imp', pG.act.type) == -1) return d.rExp < (pG.breakPointSmallScreen ? pG.maxWidthTextMovil : pG.maxWidthText) ? "hidden" : "visible";
				return d.rImp < (pG.breakPointSmallScreen ? pG.maxWidthTextMovil : pG.maxWidthText) ? "hidden" : "visible";
			}
		},

		circImpVisibilityCheck: function(d) {
			if(!d.posX) return "hidden";
			if($.inArray('imp', pG.act.type) == -1) return "hidden";
			return (d.rImp < pG.minCirc) ? "hidden" : "visible";
		},

		circImpRadius: function(d) {
			if(!d.posX) return 0;
			if($.inArray('imp', pG.act.type) == -1) return 0;
			if(pG.act.type.length == 2) return d.rTotImp;
			else return d.rImp;
		},

		circExpVisibilityCheck: function(d) {
			if(!d.posX) return "hidden";
			if($.inArray('exp', pG.act.type) == -1) return "hidden";
			return (($.inArray('imp', pG.act.type) == -1 ? d.rExp : d.rTot) < pG.minCirc) ? "hidden" : "visible";
		},

		circExpRadius: function(d) {
			if(!d.posX) return 0;
			if($.inArray('exp', pG.act.type) == -1) return 0;
			return ($.inArray('imp', pG.act.type) == -1) ? d.rExp : d.rTot;
		},

		collideRadiusFn: function(d) {
			var param = d.rTot;
			if(pG.act.type.length != 2) {
				param = $.inArray('imp', pG.act.type) == -1 ? d.rExp : d.rImp;
			}
			return param + 5;
		},

		changeProduct: function(e) {
			
			e.preventDefault();
			
			$('#prods .act').removeClass('act');

			var prod = $(this).addClass('act').data('prod');
			if(!prod || pG.act.prod == prod) { console.log('no hay producto'); return; }

			pG.act.prod = prod;

				// carga datos nuevos y pinta
			pG.tools.update();
		},

		gotoYear: function(year) {

			if(!year || pG.act.year == year || year > pG.lastYear || year < pG.initYear) return;

			pG.act.year = year;
			
			$('#years .act').removeClass('act');
			$('#years .disabled').removeClass('disabled');
			$('#years [data-year="' + year + '"]').addClass('act');

			if(year == pG.lastYear) $('#years .nextYear').addClass('disabled');
			if(year == pG.initYear) $('#years .prevYear').addClass('disabled');

			$('#activeYear').html(year);

				// actualiza el dibujo
			pG.tools.update();
		},

		changeYear: function(e) {
			
			e.preventDefault();

			pG.evs.gotoYear($(this).data('year'));
		},

		prevYear: function(e) {
			
			e.preventDefault();

			if(pG.act.year == pG.initYear) return;

			pG.evs.gotoYear(pG.act.year - 1);

		},

		nextYear: function(e) {
			
			e.preventDefault();

			if(pG.act.year == pG.lastYear) return;

			pG.evs.gotoYear(pG.act.year + 1);
		},

		changeType: function(e) {
			
			e.preventDefault();

			var $this = $(this);
			var type = $this.data('type');

			if($.inArray(type, pG.act.type) == -1){
					
				$this.addClass('act');
				pG.act.type.push(type);

			} else {

				if(pG.act.type.length == 1) {
					pG.act.type = ['imp', 'exp'];
					
					$('#type a').addClass('act');

				} else {
					pG.act.type = [type];
					
					$('#type a.act').removeClass('act');
					
					$this.addClass('act');

				}
			}

				// actualiza el dibujo
			pG.tools.update();

		}
	},

};

pG.init();

function throttle (callback, limit) {   // http://sampsonblog.com/749/simple-throttle-function modificado!
	var wait = false;                 // Initially, we're not waiting
	return function () {              // We return a throttled function
		if (!wait) {                  // If we're not waiting
									   // Execute users function
			wait = true;              // Prevent future invocations
			setTimeout(function () {  // After a period of time
				callback.call();
				wait = false;         // And allow future invocations
			}, limit);
		}
	};
}

function numberThousandsDots (number) {
	return number.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
}

function firstCapital(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function millionsParser (ammount) {
	var data = ammount / 1000000;
	if(data > 1) return numberThousandsDots(parseInt(data, 10));
	return data.toFixed(2).replace('.', ',');
}


function shareTweet (texto, url, hash, via) {
	if(!texto) return false;

	var windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes',
		width = 550,
		height = 420,
		winHeight = screen.height,
		winWidth = screen.width;

	var left = Math.round((winWidth / 2) - (width / 2));
	var top = 0;

	if (winHeight > height) {
	  top = Math.round((winHeight / 2) - (height / 2));
	}

	var target = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(texto);
	if(url && url !== false) {
		target += '&url=' + clearUrl(url);
	} else if (url !== false) { target += '&url=' + encodeURIComponent(window.location.href); }
	
	if(hash) target += '&hashtags=' + encodeURIComponent(hash);
	if(via) target += '&via=' + encodeURIComponent(via);

	window.open(target, 'intent', windowOptions + ',width=' + width +
									   ',height=' + height + ',left=' + left + ',top=' + top);

	function clearUrl(url) {
		if(url.indexOf('#') != -1) url = url.substring(0, url.indexOf('#'));
		if(url.indexOf('?') != -1) url = url.substring(0, url.indexOf('?'));
		return url;
	}
}
