#!/usr/bin/env python3
"""
elfinfo.py — citeste din binarele de server pe ce sistem au fost construite.

Raspunde, fara sa execute nimic si fara unelte externe (doar Python 3):
  - arhitectura: i386 sau amd64
  - sistemul si versiunea de FreeBSD pentru care au fost construite
  - compilatorul: clang sau gcc, si ce versiune
  - bibliotecile dinamice cerute — inclusiv daca apar SI libstdc++ SI libc++

    python3 tools/elfinfo.py cale/catre/game cale/catre/db

Merge pe Windows, Linux si FreeBSD deopotriva. Nu ruleaza binarul.
"""

import struct
import sys

EM = {3: "i386 (32-bit)", 62: "amd64 (64-bit)", 40: "ARM", 183: "AArch64"}
OSABI = {0: "System V / Linux", 3: "Linux", 9: "FreeBSD", 12: "OpenBSD", 2: "NetBSD"}
ET = {1: "REL (obiect)", 2: "EXEC (executabil)", 3: "DYN (PIE / biblioteca)"}


def bsd_version(v):
    """__FreeBSD_version -> 'major.minor' (ex. 1201000 -> 12.1)."""
    return "%d.%d" % (v // 100000, (v // 1000) % 100)


class Elf:
    def __init__(self, path):
        with open(path, "rb") as fh:
            self.d = fh.read()
        if self.d[:4] != b"\x7fELF":
            raise ValueError("nu e ELF (binar de FreeBSD/Linux)")
        self.bits = 64 if self.d[4] == 2 else 32
        self.end = "<" if self.d[5] == 1 else ">"
        self.osabi = self.d[7]
        self.abiver = self.d[8]
        p = self.end + ("HHIQQQIHHHHHH" if self.bits == 64 else "HHIIIIIHHHHHH")
        (self.e_type, self.e_machine, _, _, _, self.e_shoff, _, _, _, _,
         self.e_shentsize, self.e_shnum, self.e_shstrndx) = struct.unpack_from(p, self.d, 16)
        self._sections = None

    def sections(self):
        if self._sections is not None:
            return self._sections
        out = []
        if not self.e_shoff or not self.e_shnum:
            self._sections = out
            return out
        fmt = self.end + ("IIQQQQIIQQ" if self.bits == 64 else "IIIIIIIIII")
        raw = []
        for i in range(self.e_shnum):
            off = self.e_shoff + i * self.e_shentsize
            if off + struct.calcsize(fmt) > len(self.d):
                break
            raw.append(struct.unpack_from(fmt, self.d, off))
        if self.e_shstrndx < len(raw):
            st_off, st_size = raw[self.e_shstrndx][4], raw[self.e_shstrndx][5]
            strtab = self.d[st_off:st_off + st_size]
        else:
            strtab = b""
        for r in raw:
            name_off = r[0]
            end = strtab.find(b"\0", name_off)
            name = strtab[name_off:end].decode("ascii", "replace") if end > 0 else ""
            out.append({"name": name, "type": r[1], "offset": r[4], "size": r[5],
                        "link": r[6], "entsize": r[9]})
        self._sections = out
        return out

    def section(self, name):
        for s in self.sections():
            if s["name"] == name:
                return s
        return None

    def freebsd_version(self):
        """Citeste nota cu ABI-ul de FreeBSD."""
        for s in self.sections():
            if s["type"] != 7:                       # SHT_NOTE
                continue
            blob = self.d[s["offset"]:s["offset"] + s["size"]]
            i = 0
            while i + 12 <= len(blob):
                nsz, dsz, ntype = struct.unpack_from(self.end + "III", blob, i)
                i += 12
                name = blob[i:i + nsz].rstrip(b"\0")
                i += (nsz + 3) & ~3
                desc = blob[i:i + dsz]
                i += (dsz + 3) & ~3
                if name == b"FreeBSD" and ntype == 1 and len(desc) >= 4:
                    return struct.unpack_from(self.end + "I", desc, 0)[0]
        return None

    def compilers(self):
        s = self.section(".comment")
        if not s:
            return []
        blob = self.d[s["offset"]:s["offset"] + s["size"]]
        seen, out = set(), []
        for part in blob.split(b"\0"):
            t = part.decode("utf-8", "replace").strip()
            if t and t not in seen:
                seen.add(t)
                out.append(t)
        return out

    def needed(self):
        dyn = self.section(".dynamic")
        dstr = self.section(".dynstr")
        if not dyn or not dstr:
            return []
        strtab = self.d[dstr["offset"]:dstr["offset"] + dstr["size"]]
        fmt = self.end + ("qQ" if self.bits == 64 else "iI")
        step = struct.calcsize(fmt)
        out = []
        off = dyn["offset"]
        while off + step <= dyn["offset"] + dyn["size"]:
            tag, val = struct.unpack_from(fmt, self.d, off)
            off += step
            if tag == 0:                              # DT_NULL
                break
            if tag in (1, 15, 29):                    # NEEDED, RPATH, RUNPATH
                end = strtab.find(b"\0", val)
                if end > 0:
                    label = {1: "", 15: "RPATH ", 29: "RUNPATH "}[tag]
                    out.append(label + strtab[val:end].decode("ascii", "replace"))
        return out


def report(path):
    print("=" * 68)
    print(path)
    print("=" * 68)
    try:
        e = Elf(path)
    except (OSError, ValueError) as exc:
        print("  ! %s" % exc)
        return
    print("  tip           : %s" % ET.get(e.e_type, e.e_type))
    print("  arhitectura   : %s" % EM.get(e.e_machine, "necunoscuta (%d)" % e.e_machine))
    print("  OS ABI        : %s" % OSABI.get(e.osabi, "necunoscut (%d)" % e.osabi))

    v = e.freebsd_version()
    if v:
        print("  FreeBSD       : %s  (__FreeBSD_version %d)" % (bsd_version(v), v))
    elif e.osabi == 9:
        print("  FreeBSD       : marcat FreeBSD, dar fara nota de versiune")

    comps = e.compilers()
    if comps:
        print("  compilator    :")
        for c in comps:
            print("      %s" % c)
    else:
        print("  compilator    : necunoscut (sectiunea .comment lipseste — binar strip-uit)")

    libs = e.needed()
    if libs:
        print("  biblioteci    :")
        for l in libs:
            print("      %s" % l)
        has_gnu = any("libstdc++" in l for l in libs)
        has_llvm = any(l.startswith("libc++") or "/libc++" in l for l in libs)
        print()
        if has_gnu and has_llvm:
            print("  >>> ATENTIE: apar SI libstdc++ SI libc++ in acelasi binar.")
            print("      Doua biblioteci standard C++ in acelasi proces = crash la pornire.")
            print("      Vezi docs/migrare.md §B2 pentru cauze si rezolvare.")
        elif has_gnu:
            print("  -> C++ pe libstdc++ (lant gcc). Tot codul C++ trebuie sa fie pe libstdc++.")
        elif has_llvm:
            print("  -> C++ pe libc++ (lant clang). Tot codul C++ trebuie sa fie pe libc++.")
    else:
        print("  biblioteci    : niciuna (legat static) sau sectiuni lipsa")
    print()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__.strip())
    for path in sys.argv[1:]:
        report(path)
    print("Nota: astea sunt proprietatile BINARULUI livrat, nu ale VPS-ului.")
    print("Versiunea reala de pe server se afla cu `uname -a` si `cc --version`.")


if __name__ == "__main__":
    main()
