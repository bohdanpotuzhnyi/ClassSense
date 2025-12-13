#!/usr/bin/make -f

# Debian-friendly make recipe to build the final PDF.
# Image conversion steps are commented out because PNG assets are already provided.

PANDOC ?= pandoc
MARKDOWN ?= report.md
OUTPUT ?= report.pdf
BIB ?= bib/references.bib
CSL ?= bib/apa.csl
TEMPLATE ?=

PANDOC_FLAGS = --listings --from markdown+citations --bibliography=$(BIB) --csl=$(CSL) --citeproc --filter pandoc-include
ifneq ($(strip $(TEMPLATE)),)
PANDOC_FLAGS += --template=$(TEMPLATE)
endif

.PHONY: all pdf clean

all: pdf

pdf: $(OUTPUT)

$(OUTPUT): $(MARKDOWN) $(BIB) $(CSL)
	$(PANDOC) -o $@ $< $(PANDOC_FLAGS)

clean:
	rm -f $(OUTPUT)

# Optional diagram regeneration (disabled because PNGs are already supplied)
#PLANTUML_DIR = pictures/plantumls
#DRAWIO_DIR = pictures/drawios
#BPMN_DIR = pictures/bpmns
#SVG_DIR = pictures/svg
#
#.PHONY: diagrams plantuml drawio bpmn svg
#diagrams: plantuml drawio bpmn svg
#
#plantuml:
#	plantuml $(PLANTUML_DIR)/*.puml -tsvg
#	inkscape $(PLANTUML_DIR)/*.svg --export-type=png --export-dpi=300
#
#drawio:
#	drawio --export $(DRAWIO_DIR)/*.drawio --format png --crop --transparent --scale 3 --output $(DRAWIO_DIR)
#
#bpmn:
#	bpmn-to-image $(BPMN_DIR)/*.bpmn --scale 3 --no-footer
#
#svg:
#	inkscape $(SVG_DIR)/*.svg --export-type=png --export-dpi=300
