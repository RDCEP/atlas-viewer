#!/usr/bin/env python
# -*- coding: utf-8 -*-
from math import log10, floor


def round_to_n(x, n):
    round(x, -int(floor(log10(x))) + (n - 1))
