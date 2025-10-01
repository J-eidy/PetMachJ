/* app.js - lógica del formulario PetMatch (con preferencias de perro) */
(function(){
  // Helpers
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const form = qs('#adoptForm');
  const panels = qsa('.panel');
  const steps = qsa('.step');
  const progressBar = qs('#progressBar');

  let stepIndex = 0;
  const maxSteps = panels.length;

  function setStep(i){
    stepIndex = Math.max(0, Math.min(i, maxSteps-1));
    panels.forEach(p => p.classList.remove('active'));
    steps.forEach(s => s.classList.remove('active'));
    panels[stepIndex].classList.add('active');
    const stepLabels = qs(`.step[data-step="${stepIndex}"]`);
    if(stepLabels) stepLabels.classList.add('active');
    const pct = Math.round(((stepIndex)/(maxSteps-1))*100);
    progressBar.style.width = pct + '%';
    updateSummary();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  // Validation helpers
  function showError(id, msg){ const el = qs('#'+id); if(el) el.textContent = msg || ''; }
  function validateStep(i){
    clearErrors();
    if(i===0){
      const name = qs('#fullName').value.trim();
      if(name.split(/\s+/).length < 2){ showError('err_fullName','Ingresa nombre y apellido.'); return false; }
      const age = parseInt(qs('#age').value,10);
      if(isNaN(age) || age < 18){ showError('err_age','Debes ser mayor de edad (>=18).'); return false; }
      const email = qs('#email').value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showError('err_email','Correo inválido.'); return false; }
      const phone = qs('#phone').value.replace(/\s+/g,'');
      if(!/^[\d\+\-\(\) ]{7,20}$/.test(phone)){ showError('err_phone','Teléfono inválido.'); return false; }
      if(!qs('#docType').value){ alert('Selecciona el tipo de documento.'); return false; }
      if(!qs('#docNumber').value.trim()){ alert('Ingresa número de documento.'); return false; }
      if(!qs('#city').value.trim()){ alert('Ingresa ciudad/barrio.'); return false; }
      return true;
    }
    if(i===1){
      if(!qs('#housingType').value){ alert('Selecciona tipo de vivienda.'); return false; }
      const ownershipEls = qsa('[name="ownership"]');
      const ownership = ownershipEls.find(r=>r.checked)?.value;
      if(!ownership){ alert('Selecciona si vives en arriendo o propio.'); return false; }
      if(!qs('#housemates').value){ alert('Selecciona con quién vives.'); return false; }
      if(!qs('#experience').value){ alert('Selecciona tu experiencia con mascotas.'); return false; }

      // Validate priority requirement
      if(!qs('#priorityReq').value){ alert('Selecciona prioridad de requisitos para la preferencia del perro.'); return false; }

      // owner auth required if arriendo
      if(ownership === 'arriendo'){
        const f = qs('#ownerAuth');
        if(!f || !f.files || f.files.length===0){
          showError('err_ownerAuth','Debes subir autorización del propietario si estás en arriendo.');
          return false;
        }
      }
      return true;
    }
    if(i===2){
      if(!qs('#acceptTerms').checked){ showError('err_terms','Debes aceptar términos y políticas.'); return false; }
      return true;
    }
    return true;
  }
  function clearErrors(){
    qsa('.error').forEach(e => e.textContent='');
  }

  // Step navigation
  qs('#next1').addEventListener('click', ()=>{ if(validateStep(0)) setStep(1); });
  qs('#next2').addEventListener('click', ()=>{ if(validateStep(1)) setStep(2); });
  qs('#prev2').addEventListener('click', ()=>setStep(0));
  qs('#prev3').addEventListener('click', ()=>setStep(1));

  // Save draft
  qs('#saveDraft').addEventListener('click', saveDraft);
  qs('#clearDraft').addEventListener('click', e => {
    if(confirm('Borrar borrador guardado localmente?')){ localStorage.removeItem('petmatch_draft'); form.reset(); loadDraftToUI(); alert('Borrador eliminado'); }
  });

  function collectFormData(){
    const ownership = qsa('[name="ownership"]').find(r=>r.checked)?.value || '';
    const otherPets = qsa('[name="otherPets"]').find(r=>r.checked)?.value || 'no';
    // collect temperament checks
    const temperament = qsa('[name="desiredTemperament"]:checked').map(c => c.value);
    const data = {
      fullName: qs('#fullName').value.trim(),
      age: qs('#age').value,
      docType: qs('#docType').value,
      docNumber: qs('#docNumber').value.trim(),
      email: qs('#email').value.trim(),
      phone: qs('#phone').value.trim(),
      city: qs('#city').value.trim(),
      housingType: qs('#housingType').value,
      ownership: ownership,
      housemates: qs('#housemates').value,
      hasKids: qs('#hasKids').checked,
      hasSeniors: qs('#hasSeniors').checked,
      otherPets: otherPets,
      otherPetsInfo: qs('#otherPetsInfo').value.trim(),
      experience: qs('#experience').value,
      // Preferences for dog
      desiredSpecies: qs('#desiredSpecies').value,
      desiredBreed: qs('#desiredBreed').value.trim(),
      desiredSize: qs('#desiredSize').value,
      desiredAgeRange: qs('#desiredAgeRange').value,
      desiredTemperament: temperament,
      energyLevel: qs('#energyLevel').value,
      kidFriendly: qs('#kidFriendly').value,
      otherPetsOk: qs('#otherPetsOk').value,
      coatLength: qs('#coatLength').value,
      colorPref: qs('#colorPref').value.trim(),
      priorityReq: qs('#priorityReq').value,
      references: qs('#references').value.trim(),
      comments: qs('#comments').value.trim(),
      acceptTerms: qs('#acceptTerms').checked,
      savedAt: new Date().toISOString()
    };
    return data;
  }

  function saveDraft(){
    const data = collectFormData();
    localStorage.setItem('petmatch_draft', JSON.stringify(data));
    alert('Borrador guardado localmente.');
  }

  function loadDraftToUI(){
    const raw = localStorage.getItem('petmatch_draft');
    if(!raw) return;
    try{
      const d = JSON.parse(raw);
      qs('#fullName').value = d.fullName || '';
      qs('#age').value = d.age || '';
      qs('#docType').value = d.docType || '';
      qs('#docNumber').value = d.docNumber || '';
      qs('#email').value = d.email || '';
      qs('#phone').value = d.phone || '';
      qs('#city').value = d.city || '';
      qs('#housingType').value = d.housingType || '';
      if(d.ownership) { const el = qsa('[name="ownership"]'); el.forEach(r=> r.value===d.ownership && (r.checked=true)); }
      qs('#housemates').value = d.housemates || '';
      qs('#hasKids').checked = !!d.hasKids;
      qs('#hasSeniors').checked = !!d.hasSeniors;
      if(d.otherPets) { const el = qsa('[name="otherPets"]'); el.forEach(r=> r.value===d.otherPets && (r.checked=true)); }
      qs('#otherPetsInfo').value = d.otherPetsInfo || '';
      qs('#experience').value = d.experience || '';

      // Preferences
      qs('#desiredSpecies').value = d.desiredSpecies || '';
      qs('#desiredBreed').value = d.desiredBreed || '';
      qs('#desiredSize').value = d.desiredSize || '';
      qs('#desiredAgeRange').value = d.desiredAgeRange || '';
      if(Array.isArray(d.desiredTemperament)){
        qsa('[name="desiredTemperament"]').forEach(ch => ch.checked = d.desiredTemperament.includes(ch.value));
      }
      qs('#energyLevel').value = d.energyLevel || '';
      qs('#kidFriendly').value = d.kidFriendly || '';
      qs('#otherPetsOk').value = d.otherPetsOk || '';
      qs('#coatLength').value = d.coatLength || '';
      qs('#colorPref').value = d.colorPref || '';
      qs('#priorityReq').value = d.priorityReq || '';

      qs('#references').value = d.references || '';
      qs('#comments').value = d.comments || '';
      qs('#acceptTerms').checked = !!d.acceptTerms;

      toggleOtherPetsSection();
      toggleOwnerAuthSection();
      updateSummary();
    }catch(e){
      console.warn('No se pudo cargar borrador', e);
    }
  }

  // File previews
  function previewImages(inputEl, containerEl){
    const box = qs(containerEl);
    box.innerHTML='';
    const files = inputEl.files || [];
    Array.from(files).slice(0,6).forEach(file=>{
      if(!file.type.startsWith('image/')) return;
      const img = document.createElement('img');
      img.alt = file.name;
      const fr = new FileReader();
      fr.onload = e => img.src = e.target.result;
      fr.readAsDataURL(file);
      box.appendChild(img);
    });
  }

  if(qs('#homePhotos')) qs('#homePhotos').addEventListener('change', e => previewImages(e.target, '#homePreview'));
  if(qs('#ownerAuth')) qs('#ownerAuth').addEventListener('change', e => {
    const box = qs('#ownerPreview'); box.innerHTML='';
    const f = e.target.files[0];
    if(!f) return;
    if(f.type.startsWith('image/')){
      const img = document.createElement('img'); img.alt = f.name;
      const fr = new FileReader(); fr.onload = ev => img.src = ev.target.result; fr.readAsDataURL(f);
      box.appendChild(img);
    } else {
      const el = document.createElement('div'); el.textContent = f.name; el.className='small'; box.appendChild(el);
    }
  });

  // Conditional UI
  function toggleOtherPetsSection(){
    const v = qsa('[name="otherPets"]').find(r=>r.checked)?.value;
    qs('#otherPetsDetails').style.display = (v === 'yes') ? 'block' : 'none';
  }
  function toggleOwnerAuthSection(){
    const own = qsa('[name="ownership"]').find(r=>r.checked)?.value;
    qs('#ownerAuthBox') && (qs('#ownerAuthBox').style.display = (own === 'arriendo') ? 'block' : 'none');
  }

  qsa('[name="otherPets"]').forEach(el => el.addEventListener('change', toggleOtherPetsSection));
  qsa('[name="ownership"]').forEach(el => el.addEventListener('change', toggleOwnerAuthSection));
  qsa('[name="desiredTemperament"]').forEach(el => el.addEventListener('change', updateSummary));

  // Summary
  function updateSummary(){
    const data = collectFormData();
    const box = qs('#summaryBox');
    const temp = (data.desiredTemperament && data.desiredTemperament.length) ? data.desiredTemperament.join(', ') : '—';
    box.innerHTML = `
      <strong>Resumen (previsualización):</strong>
      <div style="margin-top:8px">
        <div><strong>Nombre:</strong> ${escapeHtml(data.fullName || '—')}</div>
        <div><strong>Edad:</strong> ${escapeHtml(data.age || '—')}</div>
        <div><strong>Ciudad:</strong> ${escapeHtml(data.city || '—')}</div>
        <div><strong>Vivienda:</strong> ${escapeHtml(data.housingType || '—')} — ${escapeHtml(data.ownership || '—')}</div>
        <div><strong>Con quién vive:</strong> ${escapeHtml(data.housemates || '—')}</div>
        <div><strong>Otras mascotas:</strong> ${(data.otherPets === 'yes') ? escapeHtml(data.otherPetsInfo || 'No especificado') : 'No'}</div>

        <hr style="border-color:rgba(255,255,255,0.03); margin:8px 0">
        <div><strong>Preferencias de mascota:</strong></div>
        <div><strong>Tipo:</strong> ${escapeHtml(data.desiredSpecies || '—')}</div>
        <div><strong>Raza preferida:</strong> ${escapeHtml(data.desiredBreed || 'Indiferente')}</div>
        <div><strong>Tamaño:</strong> ${escapeHtml(data.desiredSize || 'Indiferente')}</div>
        <div><strong>Edad preferida:</strong> ${escapeHtml(data.desiredAgeRange || 'Indiferente')}</div>
        <div><strong>Temperamento:</strong> ${escapeHtml(temp)}</div>
        <div><strong>Nivel energía:</strong> ${escapeHtml(data.energyLevel || 'Indiferente')}</div>
        <div><strong>Compatible con niños:</strong> ${escapeHtml(data.kidFriendly || 'Indiferente')}</div>
        <div><strong>Compatible con otras mascotas:</strong> ${escapeHtml(data.otherPetsOk || 'Indiferente')}</div>
        <div><strong>Tipo de pelaje:</strong> ${escapeHtml(data.coatLength || 'Indiferente')}</div>
        <div><strong>Color preferido:</strong> ${escapeHtml(data.colorPref || 'Indiferente')}</div>
        <div><strong>Prioridad:</strong> ${escapeHtml(data.priorityReq || '—')}</div>

        <div style="margin-top:6px"><em>Fecha borrador:</em> ${escapeHtml(data.savedAt || '—')}</div>
      </div>
    `;
  }

  function escapeHtml(s){ if(!s && s !== 0) return ''; return s.toString().replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Submit (simulado)
  form.addEventListener('submit', e => {
    e.preventDefault();
    if(!validateStep(2)) return;
    const payload = collectFormData();
    const homeFiles = qs('#homePhotos').files;
    payload.homePhotos = Array.from(homeFiles).map(f=> ({name:f.name, size:f.size, type:f.type}));
    const ownerFile = qs('#ownerAuth') && qs('#ownerAuth').files[0];
    payload.ownerAuth = ownerFile ? {name:ownerFile.name,size:ownerFile.size,type:ownerFile.type} : null;
    console.log('=== Enviando solicitud (simulada) ===', payload);
    alert('Solicitud enviada (simulación). Revisa consola para payload y conecta este flujo a tu servidor para envío real.');
    localStorage.removeItem('petmatch_draft');
    form.reset();
    qs('#homePreview') && (qs('#homePreview').innerHTML='');
    qs('#ownerPreview') && (qs('#ownerPreview').innerHTML='');
    updateSummary();
    setStep(0);
  });

  // On load
  loadDraftToUI();
  setStep(0);
  qsa('input, select, textarea').forEach(el => el.addEventListener('input', updateSummary));

  //Prueba
})();
