import re
import jinja2
import markdown
import smartypants as sp


def smartypants(text):
    return sp.smartypants(text)


def image_ratio(ratio, width=0):
    # r = width / height
    if ratio < .6:
        return 'one-by-two'
    if ratio < .8:
        return 'three-by-four'
    if width > 700 and ratio < 1.05:
        return 'two-by-two'
    if ratio < 1.05:
        return 'one-by-one'
    if ratio < 1.6:
        return 'three-by-two'
    return 'two-by-one'


def safe_markdown(text):
    return jinja2.Markup(markdown.markdown(text))


def search_markdown(text):
    text = re.sub(r'\[([^\]]+)\]\s*\(\S+(?=\))', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\s*\(\S+', r'\1', text)
    text = re.sub(r'([^\[]+)\]\([^\)]+\)?', r'\1', text)
    text = safe_markdown(text)
    return text


def nbsp(text):
    text = re.sub(r' ', '&nbsp;', text)
    return jinja2.Markup(text)

def nowrap(text):
    text = re.sub(r' ', '&nbsp;', text)
    text = re.sub(r'([^ -]+-[^ -]+)', r'<span class="nowrap">\1</span>', text)
    return jinja2.Markup(text)

def format_currency(value):
    return "${:,.2f}".format(value)