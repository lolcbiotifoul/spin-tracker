s=open('app.html').read(); e=open('engine.js').read(); r=open('rp.js').read(); c=open('rp.css').read()
s=s.replace('/*ENGINE*/', e).replace('/*REPLAYER*/', r).replace('/*RPCSS*/', c).replace('/*FILTERS*/', open('fm.js').read()).replace('/*HUD*/', open('hud.js').read()).replace('/*EXTRA*/', open('extra.js').read()).replace('/*HFILTERS*/', open('hf.js').read())
open('site/index.html','w').write(s)
print('built', len(s))
