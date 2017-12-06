<?php

namespace PhantomInstaller;

class PhantomBinary
{
    const BIN = 'C:\wamp64\www\nd\phantomjs\bin\phantomjs.exe';
    const DIR = 'C:\wamp64\www\nd\phantomjs\bin';

    public static function getBin() {
        return self::BIN;
    }

    public static function getDir() {
        return self::DIR;
    }
}
