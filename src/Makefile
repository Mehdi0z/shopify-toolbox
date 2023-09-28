.PHONY: all build clean install watch zip
.NOTPARALLEL:

DIRS = assets config layout locales sections snippets templates
LAST_TAG = $(shell git describe --tags)

ifeq ($(LAST_TAG),)
LAST_TAG=devel
endif

build:
	npm run build

clean:
	rm -rf *.zip

install:
	npm install

lint:
	npm run lint

watch:
	npm run watch

zip: build
	@echo "Creating $(LAST_TAG).zip..."
	zip -qr $(LAST_TAG).zip $(DIRS)