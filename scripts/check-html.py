#!/usr/bin/env python3
"""Lightweight HTML sanity check for PRs.

Parses index.html, resume.html and v1/index.html, then checks:
- every file parses without mismatched-tag errors (html.parser, strict-ish)
- every file has a <title>
- no duplicate id attributes within a file
- every internal #anchor href in a file points at an id that exists in it

This is deliberately not a full validator: the site uses inline scripts
and Cloudflare-injected content, so strict validation would false-positive.
"""
import sys
from html.parser import HTMLParser
from pathlib import Path

FILES = ["index.html", "resume.html", "v1/index.html"]


class Checker(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
        self.ids = {}
        self.anchors = []
        self.has_title = False
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "title":
            self.in_title = True
        if "id" in d:
            if d["id"] in self.ids:
                self.errors.append(f"duplicate id #{d['id']}")
            self.ids[d["id"]] = True
        if tag == "a" and "href" in d and d["href"].startswith("#") and len(d["href"]) > 1:
            self.anchors.append(d["href"][1:])
        if tag not in self.VOID:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if tag in self.VOID:
            return
        if not self.stack:
            self.errors.append(f"closing </{tag}> with nothing open at {self.getpos()}")
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
            return
        names = [t for t, _ in self.stack]
        if tag in names:
            self.errors.append(
                f"mismatched </{tag}> at {self.getpos()}; open tags: {names}")
            while self.stack and self.stack[-1][0] != tag:
                self.stack.pop()
            self.stack.pop()
        else:
            self.errors.append(f"stray closing </{tag}> at {self.getpos()}")
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title and data.strip():
            self.has_title = True


def main() -> int:
    failed = False
    for name in FILES:
        path = Path(name)
        if not path.exists():
            print(f"SKIP {name}: not present")
            continue
        checker = Checker()
        checker.feed(path.read_text(encoding="utf-8"))
        checker.close()
        errors = list(checker.errors)
        # </html> and </body> are optional in HTML and both files omit them;
        # only other unclosed tags are errors.
        unclosed = [t for t, _ in checker.stack if t not in ("html", "body")]
        if unclosed:
            errors.append(f"unclosed tags at end of file: {unclosed}")
        if not checker.has_title:
            errors.append("missing non-empty <title>")
        for anchor in checker.anchors:
            if anchor not in checker.ids:
                errors.append(f"internal link #{anchor} has no matching id")
        if errors:
            failed = True
            print(f"FAIL {name}:")
            for e in errors:
                print(f"  - {e}")
        else:
            print(f"OK {name}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
