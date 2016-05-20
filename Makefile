PATH := ./node_modules/.bin:$(PATH)

ARGS := --debug -t [ babelify --presets [ es2015 ] ] -g uglifyify -g envify


essay.js: main.js
	browserify $(ARGS) $< | exorcist $@.map > $@


.PHONY: watch clean

watch:
	watchify $(ARGS) -v -o 'exorcist essay.js.map > essay.js' main.js

clean:
	rm -f essay.js essay.js.map
