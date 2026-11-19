import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/ConfiguracionView"
import ReglasReservas from "../configuracion/ReglasReservas"

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
const MAX_IMAGEN = 5 * 1024 * 1024

// Secciones: [título, subtítulo, ícono, grupo, descripción, campos]
const SECS = {
  portada: ["Portada y logo", "Título, logo y fotos del carrusel", "M4 4h16v16H4zM4 9h16M9 9v11", "WEB PÚBLICA", "Lo primero que ve quien entra a la web.", ["titulo", "logo", "car"]],
  sobre: ["Sobre nosotros", "Foto, historia y misión", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01", "WEB PÚBLICA", "La foto, la historia y la misión que ven los visitantes.", ["soFoto", "soT", "soS", "soD", "soM"]],
  tarjetas: ["Tarjetas de clases", "Las 2 disciplinas de la portada", "M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12", "WEB PÚBLICA", "Las tarjetas que presentan las clases en la portada.", null],
  contacto: ["Contacto y horarios", "Teléfono, redes, dirección y horarios", "M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "WEB PÚBLICA", "Cómo encontrar y contactar al box.", ["tel", "ig", "dir", "hor"]],
  banco: ["Datos bancarios", "La cuenta para transferencias", "M3 10h18L12 4zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18", "COBROS", "La cuenta a la que transfieren los alumnos. La ven al pagar.", ["banco", "titular", "cbu", "alias", "cuit"]],
}
SECS.reglas = ["Reglas de reservas", "Horas y días para reservar y cancelar", "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 14v3l2 1", "RESERVAS", "Cuántas horas antes se reserva y se cancela, y cuántos días hacia adelante.", []]
const FD = {
  titulo: ["Título principal", "in"], logo: ["Logo de la barra superior", "img", 0, "3/1", "contain"], car: ["Fotos del carrusel", "car"],
  soFoto: ["Foto de fondo", "img", 0, "16/9", "cover"], soT: ["Título de la sección", "in"], soS: ["Frase corta", "in", 1], soD: ["Historia del box", "ta", 0, 6], soM: ["Misión", "ta", 0, 4],
  tel: ["Teléfono / WhatsApp", "in", 0, "tel"], ig: ["Instagram", "in", 1], dir: ["Dirección", "in"], hor: ["Horarios", "ta", 0, 3],
  banco: ["Banco o billetera", "in"], titular: ["Titular de la cuenta", "in"], cbu: ["CBU o CVU", "in", 0, "numeric"], alias: ["Alias", "in"], cuit: ["CUIT", "in", 1, "numeric"],
}
const FDT = { f: ["Foto de la tarjeta", "img", 0, "1/1", "cover"], n: ["Nombre de la clase", "in"], d: ["Descripción breve", "ta", 0, 3] }
const AYUDA = { cbu: "22 números, sin espacios.", cuit: "11 números, con o sin guiones.", car: "Rotan como fondo de la portada. Recomendado: 1920×1080.", logo: "Fondo transparente, PNG o SVG." }
const lineas = (s) => String(s || "").split("\n")

// Configuración del box en celular (referencia 16): web pública y datos bancarios, por secciones
export default function ConfiguracionCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta, setMenuOculto } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("configuracion:consulta") || permisos.includes("configuracion:ver")
  const puedeEditar = permisos.includes("configuracion:modificacion")
  const [raw, setRaw] = useState(null) // respuesta del servidor
  const [bancoRaw, setBancoRaw] = useState(null)
  const [vals, setVals] = useState(null)
  const [saved, setSaved] = useState(null)
  const [archivos, setArchivos] = useState({}) // clave -> { file, url }
  const [sec, setSec] = useState(null)
  const [carI, setCarI] = useState(0)
  const [tab, setTab] = useState(0)
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const selector = useRef(null)
  const objetivo = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3000) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])
  useEffect(() => { setMenuOculto(!!sec); return () => setMenuOculto(false) }, [sec, setMenuOculto])

  useEffect(() => {
    if (!puedeVer) return
    Promise.all([
      fetch(`/landing/config?t=${Date.now()}`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch("/landing/banco", { credentials: "include" }).then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => ({ data: {} })),
    ]).then(([d, b]) => {
      const bn = b?.data || {}
      const hero = Array.isArray(d.heroImages) ? d.heroImages : Object.values(d.heroImages || {})
      const v = {
        titulo: d.tituloHero || "", logo: d.logoUrl || "", car0: hero[0] || "", car1: hero[1] || "", car2: hero[2] || "",
        soFoto: d.imagenNosotros || "", soT: d.tituloNosotros || "", soS: d.subtituloNosotros || "", soD: d.descripcionNosotros || "", soM: d.mision || "",
        t0f: d.imagenClase1 || "", t0n: d.claseCard1Titulo || "", t0d: d.claseCard1Descripcion || "", t1f: d.imagenClase3 || "", t1n: d.claseCard3Titulo || "", t1d: d.claseCard3Descripcion || "",
        tel: d.telefono || "", ig: d.instagram || "", dir: d.direccion || "", hor: [d.horario_semana, d.horario_sabado, d.horario_domingo].filter((x) => x != null).join("\n"),
        banco: bn.bancoEntidad || "", titular: bn.titularCuenta || "", cbu: bn.cvuTransferencia || "", alias: bn.aliasTransferencia || "", cuit: bn.cuitTransferencia || "",
      }
      setRaw(d); setBancoRaw(bn); setVals(v); setSaved(v)
    }).catch(() => avisar("No se pudo cargar la configuración."))
  }, [puedeVer, avisar])

  const elegirArchivo = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    const k = objetivo.current
    if (!file || !k) return
    if (!TIPOS_IMAGEN.includes(file.type)) return avisar("La foto tiene que ser JPG, PNG, WEBP, GIF o SVG.")
    if (file.size > MAX_IMAGEN) return avisar("La foto pesa más de 5 MB.")
    setArchivos((a) => { if (a[k]?.url) URL.revokeObjectURL(a[k].url); return { ...a, [k]: { file, url: URL.createObjectURL(file) } } })
  }

  const v = useMemo(() => {
    const V = vals || {}, S0 = saved || {}
    const errs = { cbu: V.cbu && !/^\d{22}$/.test(V.cbu) ? "Tiene que tener 22 números, sin espacios." : "", cuit: V.cuit && V.cuit.replace(/\D/g, "").length !== 11 ? "Tiene que tener 11 números." : "", alias: V.alias && !/^[A-Za-z0-9.-]{6,20}$/.test(V.alias) ? "Entre 6 y 20 caracteres: letras, números, puntos o guiones." : "" }
    const keysDe = (s) => (s === "tarjetas" ? [`t${tab}f`, `t${tab}n`, `t${tab}d`] : s ? SECS[s][5] : [])
    const claveImg = (k) => (k === "car" ? `car${carI}` : k)
    const keys = keysDe(sec)
    const upd = (k) => (ev) => { const val = ev.target.value; setVals((s) => ({ ...s, [k]: val })) }
    const fields = keys.map((k) => {
      const d = FD[k] || FDT[k.slice(-1)]; const type = d[1]; const err = tried && errs[k]; const ck = claveImg(k)
      const src = archivos[ck]?.url || (type === "car" ? V[`car${carI}`] : V[k])
      return {
        l: d[0], opt: !!d[2] && type === "in", isIn: type === "in", isTa: type === "ta", isImg: type === "img" || type === "car", multi: type === "car",
        v: V[k], on: upd(k), ph: "", im: type === "in" && typeof d[3] === "string" ? d[3] : "text", rows: type === "ta" ? d[3] : 3, inv: err ? "true" : "false", bd: err ? c.errFg : (V[k] !== S0[k] || archivos[ck] ? c.okLine : c.line),
        h: err || AYUDA[k] || false, hFg: err ? c.errFg : c.muted,
        bgSrc: `url('${src || ""}')`, alt: d[0], ratio: type === "car" ? "16/9" : (d[3] || "16/9"), fit: type === "car" ? "cover" : (d[4] || "cover"), imgBg: k === "logo" ? "#0e0e0e" : c.surf,
        imgs: type === "car" ? [0, 1, 2].map((i) => ({ n: "Foto " + (i + 1), src: `url('${archivos[`car${i}`]?.url || V[`car${i}`] || ""}')`, bd: carI === i ? "#9be600" : "transparent", aria: `Ver foto ${i + 1} del carrusel`, pick: () => setCarI(i) })) : [],
        chg: () => { if (puedeEditar) { objetivo.current = ck; selector.current?.click() } },
      }
    })
    const cambio = (k) => (/^car/.test(k) && k !== "car" ? false : V[k] !== S0[k]) || !!archivos[k]
    const claves = sec === "tarjetas" ? [`t${tab}f`, `t${tab}n`, `t${tab}d`] : (sec ? SECS[sec][5].flatMap((k) => (k === "car" ? ["car0", "car1", "car2"] : [k])) : [])
    const dirty = sec ? claves.filter((k) => V[k] !== S0[k] || archivos[k]).length : 0
    void cambio
    const anyErr = keys.some((k) => errs[k])
    const noSave = saving || !dirty || !puedeEditar
    const s = sec ? SECS[sec] : null
    const guardar = async () => {
      if (noSave) return
      if (anyErr) { setTried(true); return }
      setSaving(true)
      try {
        if (sec === "banco") {
          const cuerpo = { bancoEntidad: V.banco.trim(), titularCuenta: V.titular.trim(), cuitTransferencia: V.cuit.trim(), cvuTransferencia: V.cbu.trim(), aliasTransferencia: V.alias.trim() }
          if (!cuerpo.cvuTransferencia && !cuerpo.aliasTransferencia && Object.values(cuerpo).some(Boolean)) throw new Error("Cargá el CBU/CVU o el alias.")
          const res = await fetch("/landing/banco", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })
          const r = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(r.message || "No se pudieron guardar los datos bancarios.")
        } else {
          const d = raw || {}, h = lineas(V.hor)
          const fd = new FormData()
          const pon = (k, val) => fd.append(k, val == null ? "" : val)
          pon("tituloHero", V.titulo); pon("tituloHeroSize", d.tituloHeroSize); pon("tituloHeroFont", d.tituloHeroFont); pon("tituloHeroAlign", d.tituloHeroAlign || "left")
          if (archivos.logo) fd.append("logo", archivos.logo.file)
          ;[0, 1, 2].forEach((i) => { if (archivos[`car${i}`]) fd.append(`imagenHero${i + 1}`, archivos[`car${i}`].file) })
          if (archivos.soFoto) fd.append("imagenNosotros", archivos.soFoto.file)
          if (archivos.t0f) fd.append("imagenClase1", archivos.t0f.file)
          if (archivos.t1f) fd.append("imagenClase3", archivos.t1f.file)
          pon("tituloNosotros", V.soT); pon("subtituloNosotros", V.soS); pon("descripcionNosotros", V.soD); pon("mision", V.soM)
          pon("claseCard1Titulo", V.t0n); pon("claseCard1Descripcion", V.t0d); pon("claseCard1Icono", d.claseCard1Icono)
          pon("claseCard3Titulo", V.t1n); pon("claseCard3Descripcion", V.t1d); pon("claseCard3Icono", d.claseCard3Icono)
          pon("direccion", V.dir); pon("telefono", V.tel); pon("email", d.email); pon("instagram", V.ig); pon("whatsapp", d.whatsapp)
          pon("legalTitular", d.legalTitular); pon("legalCuit", d.legalCuit); pon("legalDomicilio", d.legalDomicilio)
          pon("horario_semana", h[0] ?? d.horario_semana); pon("horario_sabado", h[1] ?? d.horario_sabado); pon("horario_domingo", h[2] ?? d.horario_domingo); pon("mapaUrl", d.mapaUrl)
          const res = await fetch("/landing/config", { method: "PUT", credentials: "include", body: fd })
          if (!res.ok) throw new Error("Error al guardar la configuración.")
        }
        setSaved({ ...V }); setTried(false)
        setArchivos((a) => { Object.values(a).forEach((x) => URL.revokeObjectURL(x.url)); return {} })
        avisar(sec === "banco" ? "Datos bancarios guardados." : "Cambios guardados. Ya se ven en la web.")
      } catch (err) { avisar(err.message || "No se pudo guardar.") } finally { setSaving(false) }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, menuOn: !sec, sec: !!sec, padL: sec ? "0" : "10px", hT: s ? s[0] : "Configuración", hS: s ? s[3].charAt(0) + s[3].slice(1).toLowerCase() : "",
      back: () => { setSec(null); setVals({ ...S0 }); setArchivos({}); setTried(false) },
      grupos: [["WEB PÚBLICA", ["portada", "sobre", "tarjetas", "contacto"]], ["COBROS", ["banco"]], ["RESERVAS", ["reglas"]]].map(([t, ks]) => ({ t, items: ks.map((k, i) => ({ t: SECS[k][0], s: SECS[k][1], d: SECS[k][2], sep: i ? c.line2 : "transparent", open: () => { setSec(k); setTab(0); setCarI(0); setTried(false) } })) })),
      secDesc: s ? s[4] : "", hasTabs: sec === "tarjetas",
      stabs: [V.t0n || "Tarjeta 1", V.t1n || "Tarjeta 2"].map((l, i) => { const on = tab === i; return { l, sel: on ? "true" : "false", bg: on ? "#9be600" : "transparent", fg: on ? "#0b0b0b" : c.ink, pick: () => setTab(i) } }),
      fields, note: sec === "banco" ? "Revisalos bien: es la cuenta a la que los alumnos van a transferir. Si borrás un dato, deja de mostrarse." : false,
      dirtyL: dirty ? (dirty === 1 ? "1 cambio sin guardar" : dirty + " cambios sin guardar") : "Sin cambios",
      noSave, svBg: noSave && !saving ? c.line2 : "#9be600", svFg: noSave && !saving ? c.muted : "#0b0b0b", svL: saving ? "Guardando…" : "GUARDAR CAMBIOS", save: guardar, toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals, saved, raw, bancoRaw, archivos, sec, carI, tab, tried, saving, toast, c, noLeidas, sesion, abrirNotif, abrirCuenta, puedeEditar])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver la configuración.</div>
  if (!vals) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>Cargando configuración…</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      {sec === "reglas" ? (
        <main style={{ padding: "8px 16px 40px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ margin: 0, font: "500 14px/1.45 Archivo", color: c.muted }}>{SECS.reglas[4]}</p>
          <ReglasReservas puedeModificar={puedeEditar} />
        </main>
      ) : (
        <>
          <Cuerpo v={v} />
          <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
        </>
      )}
      <input ref={selector} type="file" accept={TIPOS_IMAGEN.join(",")} onChange={elegirArchivo} style={{ display: "none" }} />
    </>
  )
}
