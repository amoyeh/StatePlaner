@echo off

:: /i is directory				/r override read only
:: /s copy all and sub directories		/w prompt all
:: /y without prompt
:: /d only newones


XCOPY P:\workdata\Personal\StatePlaner \\jobs\www\iprefer\labs\amoMade\StatePlaner /i/r/s/w/y/d /exclude:exclude.txt

PAUSE