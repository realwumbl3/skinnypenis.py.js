from random import choice

random_names = [
    "hacker",
    "wizard",
    "programmer",
    "xxLengedxx",
    "gamer",
    "pro",
    "masked",
    "unknown",
    "anonymous",
    "princess",
    "ghost",
    "ninja",
    "warrior",
    "king",
    "queen",
    "prince",
    "coder",
    "noobmaster",
    "dragon",
    "bob",
    "senior",
    "goof",
    "elite",
    "senpai",
    "deez",
    "ligma",
    "sugma",
    "sugondese",
]


# only bright colors in hex
def random_color():
    return f"#{''.join([choice('89ABCDEF') for _ in range(6)])}"


def random_name():
    return choice(random_names)
