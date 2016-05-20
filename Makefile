PATH := ./node_modules/.bin:$(PATH)

ARGS := --debug -t [ babelify --presets [ es2015 ] ] -g uglifyify -g envify


essay.js: main.js
	browserify $(ARGS) $< | exorcist $@.map > $@

processed.css: base.css
	autoprefixer-cli --browsers "last 2 versions" $< -o $@


.PHONY: watch clean

watch:
	watchify $(ARGS) -v -o 'exorcist essay.js.map > essay.js' main.js

clean:
	rm -f essay.js essay.js.map
