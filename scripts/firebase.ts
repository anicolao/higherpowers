import {existsSync} from 'node:fs';
const localJava=`${process.cwd()}/tmp/tools/jre/Contents/Home`;
const env={...process.env};if(!env.JAVA_HOME&&existsSync(`${localJava}/bin/java`)){env.JAVA_HOME=localJava;env.PATH=`${localJava}/bin:${env.PATH}`;}
const args=process.argv.slice(2);const child=Bun.spawn(['bun','x','firebase',...args],{env,stdout:'inherit',stderr:'inherit',stdin:'inherit'});process.exit(await child.exited);
