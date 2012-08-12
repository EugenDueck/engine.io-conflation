TESTS = test/*.js
REPORTER = dot

test:   
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--slow 500ms \
		--bail \
		$(TESTS)

.PHONY: test
