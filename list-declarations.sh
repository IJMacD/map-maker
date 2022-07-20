#!/bin/sh

# Lists all declarations mentioned in the source files

grep -hPo 'declarations\["\K[^"]*' $(find src -type f) | sort | uniq