#!/bin/bash

for file in web/public/img/**/*; do cwebp "$file" -o "${file%.*}.webp"; done