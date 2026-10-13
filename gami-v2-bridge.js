/* GamiAula 2.0 — Puente de ventajas para módulos.
 * Esta capa no cambia las respuestas, los contenidos ni el progreso original.
 * Los datos permanecen en el navegador hasta instalar el servicio autorizado.
 */
(function () {
  'use strict';
  var HUB_KEY = 'g0100_v8';
  var EVENTS_KEY = 'gamiaula_v2_events';
  var ID_KEY = 'gamiaula_v2_player_id';
  var MOD = /Módulo 1/.test(document.title) ? 1 : /Módulo 2/.test(document.title) ? 2 : /Módulo 3/.test(document.title) ? 3 : 0;
  if (!MOD) return;
  var ABILITIES = [
    {key:'narrativa', label:'Narrativa', icon:'📖', title:'Crónica aplicada'},
    {key:'diseno', label:'Diseño', icon:'🏛', title:'Plano de aprendizaje'},
    {key:'creatividad', label:'Creatividad', icon:'✦', title:'Laboratorio de ideas'},
    {key:'motivacion', label:'Motivación', icon:'◆', title:'Guía del mentor'},
    {key:'estrategia', label:'Estrategia', icon:'♟', title:'Descarte estratégico'}
  ];
  var GUIDES = {
    1:{
      narrativa:'Cuenta una escena de aula donde un reto tenga sentido. Separa la historia de las reglas y de las insignias visibles.',
      diseno:'Ordena tu análisis en cuatro capas: objetivo de aprendizaje, dinámica vivida, mecánica que orienta las acciones y componente visible.',
      creatividad:'Transforma una rutina de inicio de clase en una misión corta sin depender de premios materiales. Justifica el cambio.',
      motivacion:'Antes de responder, identifica qué permite elegir al estudiante, qué le hace sentirse competente y cómo podría colaborar.'
    },
    2:{
      narrativa:'Describe dos versiones de una misma misión, una unplugged y otra plugged. ¿Qué mantiene su sentido pedagógico en ambas?',
      diseno:'Dibuja la secuencia: necesidad del grupo → objetivo → herramienta o recurso → regla → feedback → evidencia de aprendizaje.',
      creatividad:'Combina una actividad analógica con una plataforma digital, pero diseña una alternativa sin conexión para el mismo resultado.',
      motivacion:'Revisa cómo se comunica el progreso: ¿hay metas comprensibles, feedback orientador y oportunidades razonables para reintentar?'
    },
    3:{
      narrativa:'Cuenta cómo un mismo reto podría ser experimentado de manera distinta por un explorador, un triunfador y un filántropo.',
      diseno:'Aplica 6D: objetivos, comportamientos, jugadores, ciclos de actividad, diversión y herramientas. Verifica la coherencia de la ruta.',
      creatividad:'Diseña dos rutas para un mismo objetivo: una de exploración y otra de construcción. Ambas deben demostrar el mismo aprendizaje.',
      motivacion:'Compara dificultad y habilidad. Si surge ansiedad, añade apoyo; si surge aburrimiento, incorpora profundidad o elección.'
    }
  };
  function getJSON(key, fallback) { try { var raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e) { return fallback; } }
  function putJSON(key, value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch(e) { return false; } }
  function getPlayer() { var p=getJSON(HUB_KEY,null); return p && p.skills && p.class ? p : null; }
  function getId() {
    var id=localStorage.getItem(ID_KEY);
    if (!id) { id='gami_'+(window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)); localStorage.setItem(ID_KEY,id); }
    return id;
  }
  function station() { try { return typeof state !== 'undefined' ? String(state.currentStation||'portal') : 'portal'; } catch(e) { return 'portal'; } }
  function event(type, skill, detail) {
    var a=getJSON(EVENTS_KEY,[]);
    if (!Array.isArray(a)) a=[];
    a.push({event_id:getId()+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),player_id:getId(),at:new Date().toISOString(),type:type,module:MOD,station:station(),skill:skill||'',detail:detail||''});
    putJSON(EVENTS_KEY,a.slice(-1500));
  }
  function escapeHTML(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function levelFor(p,key){return Math.max(0,Number(p && p.skills && p.skills[key])||0);}
  function tier(lv){return lv>=8?3:lv>=5?2:lv>=3?1:0;}
  var STRATEGY_KEY='gamiaula_v2_strat_'+MOD+'_';
  function strategyUsed(){return getJSON(STRATEGY_KEY+getId(),[]);}
  function strategyLimit(lv){return lv>=8?3:lv>=5?2:lv>=3?1:0;}
  function applyStrategy(){
    var arr=strategyUsed();
    if (!Array.isArray(arr)) return;
    arr.forEach(function(x){
      var sel='input[type="radio"][name="q'+Number(x.q)+'"][value="'+Number(x.option)+'"]';
      var input=document.querySelector(sel);
      if(input && input.closest('label')){input.disabled=true;input.closest('label').classList.add('gami-v2-eliminated');}
    });
  }
  function removeWrong(){
    var p=getPlayer(), lv=levelFor(p,'estrategia'), used=strategyUsed(), cap=strategyLimit(lv);
    if(lv<3){return 'Necesitas Estrategia 3 para activar el descarte.';}
    if(station()!=='principal'){return 'Entra al Santuario (misión principal) para aplicar el descarte.';}
    if(used.length>=cap){return 'Ya utilizaste todos tus descartes en este módulo.';}
    if(typeof QUIZ==='undefined'){return 'Esta actividad no permite descarte automático.';}
    for(var i=0;i<QUIZ.length;i++){
      var inputs=Array.prototype.slice.call(document.querySelectorAll('input[type="radio"][name="q'+i+'"]'));
      if(!inputs.length || inputs.some(function(el){return el.checked;}))continue;
      var correct=Number(QUIZ[i][2]);
      var excluded=used.filter(function(x){return x.q===i;}).map(function(x){return x.option;});
      var candidates=inputs.filter(function(el){return Number(el.value)!==correct && excluded.indexOf(Number(el.value))===-1;});
      if(candidates.length){
        var candidate=candidates[(i+getId().length+used.length)%candidates.length];
        var opt=Number(candidate.value);
        used.push({q:i,option:opt});
        putJSON(STRATEGY_KEY+getId(),used);
        applyStrategy();
        event('advantage_activated','estrategia','discard_question_'+(i+1));
        return 'Descartaste una alternativa incorrecta en la pregunta '+(i+1)+'. Puedes continuar sin perder tu respuesta.';
      }
    }
    return 'Responde las preguntas pendientes o vuelve a la misión principal para usar este talento.';
  }
  function css(){
    var el=document.createElement('style'); el.textContent=
      '#gami-v2-trigger{position:fixed;right:18px;bottom:18px;z-index:2147482000;background:#142b46;color:#ffe4a4;border:1px solid #d7af57;padding:12px 16px;border-radius:999px;box-shadow:0 12px 35px #0008;cursor:pointer;font:700 14px system-ui,sans-serif}' +
      '#gami-v2-backdrop{position:fixed;inset:0;z-index:2147482001;background:rgba(3,7,14,.84);display:none;align-items:center;justify-content:center;padding:14px}' +
      '#gami-v2-backdrop.open{display:flex}' +
      '#gami-v2-dialog{width:min(790px,100%);max-height:min(88vh,900px);overflow:auto;border:1px solid #bd9451;border-radius:20px;background:#111d2d;color:#f0f5ff;box-shadow:0 25px 85px #000c;padding:22px;font:14px/1.6 system-ui,sans-serif}' +
      '#gami-v2-dialog h2{margin:0;color:#ffdf97;font-size:23px;font-weight:750}' +
      '#gami-v2-dialog p{margin:7px 0 13px;color:#bed0e7}' +
      '#gami-v2-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:18px 0}' +
      '.gami-v2-card{padding:13px;border:1px solid #3a5370;border-radius:13px;background:#1a2a3e}' +
      '.gami-v2-card h3{font-size:15px;margin:0 0 5px;color:#ffffff}' +
      '.gami-v2-card small{color:#c4d3e7}' +
      '.gami-v2-card button,#gami-v2-close{border:1px solid #b99b65;background:#264561;color:#fff3d1;padding:8px 12px;border-radius:9px;margin-top:9px;cursor:pointer;font:600 12px system-ui,sans-serif}' +
      '.gami-v2-card button[disabled]{opacity:.45;cursor:not-allowed}' +
      '#gami-v2-message{padding:11px 13px;border-left:3px solid #eec36f;background:#253952;color:#fff;border-radius:7px;white-space:pre-wrap}' +
      '.gami-v2-eliminated{opacity:.33!important;text-decoration:line-through!important;pointer-events:none!important}' +
      '#gami-v2-dialog a{color:#a6e4f9}';
    document.head.appendChild(el);
  }
  var backdrop=null;
  function render(){
    if(!backdrop)return;
    var p=getPlayer(), grid=document.getElementById('gami-v2-grid');
    if(!p){grid.innerHTML='<p>Primero crea tu personaje en el Centro de Comando. Si ya lo hiciste, ábrelo y este módulo desde el mismo dominio de GitHub Pages; en Genially la sincronización puede estar limitada por el navegador.</p><a target="_blank" rel="noopener noreferrer" href="https://nespinozagonzalez-hub.github.io/introGami/">Abrir Centro de Comando</a>';return;}
    var html='<p>Personaje: <strong>'+escapeHTML(p.name)+'</strong> · Clase: '+escapeHTML(p.class)+'. Las ventajas se desbloquean desde nivel 3 de cada atributo; mejoran en los niveles 5 y 8.</p>';
    ABILITIES.forEach(function(a){
      var lv=levelFor(p,a.key), t=tier(lv), text=a.key==='estrategia' ? 'Elimina una opción incorrecta de una pregunta pendiente en la misión principal. Usos disponibles: '+Math.max(0,strategyLimit(lv)-strategyUsed().length)+'.' : GUIDES[MOD][a.key];
      html+='<section class="gami-v2-card"><h3>'+a.icon+' '+a.label+' · nivel '+lv+'</h3><small>'+a.title+' · '+(t?'Dominio '+t:'Bloqueado (requiere 3)')+'</small><p>'+escapeHTML(text)+'</p><button type="button" data-gami-skill="'+a.key+'" '+(t?'':'disabled')+'>'+(a.key==='estrategia'?'Usar descarte':'Consultar ventaja')+'</button></section>';
    });
    grid.innerHTML=html;
    grid.querySelectorAll('[data-gami-skill]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var skill=btn.getAttribute('data-gami-skill');
        var msg=skill==='estrategia'?removeWrong():GUIDES[MOD][skill];
        if(skill!=='estrategia')event('advantage_consulted',skill,'tier_'+tier(levelFor(p,skill)));
        document.getElementById('gami-v2-message').textContent=msg;
        render();
      });
    });
  }
  function setup(){
    css();
    var b=document.createElement('button');b.id='gami-v2-trigger';b.type='button';b.textContent='✦ Ventajas del aventurero';b.setAttribute('aria-label','Abrir habilidades y ventajas del personaje');
    backdrop=document.createElement('div');backdrop.id='gami-v2-backdrop';
    backdrop.innerHTML='<section id="gami-v2-dialog" role="dialog" aria-modal="true" aria-label="Ventajas del aventurero"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h2>Ventajas del aventurero</h2><button type="button" id="gami-v2-close">Cerrar</button></div><div id="gami-v2-grid"></div><div id="gami-v2-message" role="status">Elige una ventaja para utilizarla durante tu recorrido.</div></section>';
    document.body.appendChild(b);document.body.appendChild(backdrop);
    b.addEventListener('click',function(){render();backdrop.classList.add('open');document.getElementById('gami-v2-close').focus();});
    document.getElementById('gami-v2-close').addEventListener('click',function(){backdrop.classList.remove('open');b.focus();});
    backdrop.addEventListener('click',function(e){if(e.target===backdrop)backdrop.classList.remove('open');});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')backdrop.classList.remove('open');});
    var view=document.getElementById('viewWrap');
    if(view){var observer=new MutationObserver(function(){applyStrategy();}); observer.observe(view,{childList:true,subtree:true});}
    applyStrategy();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();