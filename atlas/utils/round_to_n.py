#!/usr/bin/env python
# -*- coding: utf-8 -*-

# http://stackoverflow.com/questions/18915378/rounding-to-significant-figures-in-numpy

import numpy as np


__logBase10of2 = 3.010299956639811952137388947244930267681898814621085413104274611e-1


def round_to_n(x, n):
    if not (type(n) is int or np.issubdtype(n, np.integer)):
        raise TypeError("RoundToSigFigs: sigfigs must be an integer.")

    if not np.all(np.isreal(x)):
        raise TypeError("RoundToSigFigs: all x must be real.")

    if n <= 0:
        raise ValueError("RoundtoSigFigs: sigfigs must be positive.")

    mantissas, binary_exps = np.frexp(x)

    decimal_exps = __logBase10of2 * binary_exps
    intParts = np.floor(decimal_exps)

    mantissas *= 10.0 ** (decimal_exps - intParts)

    return np.around(mantissas, decimals=n - 1) * 10.0 ** intParts
