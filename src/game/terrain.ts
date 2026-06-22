import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  DynamicTexture,
  Texture,
} from '@babylonjs/core';
import { CONFIG } from './config';

/** 外星地表材質：深鈷藍岩質地殼，含礦物斑點、龜裂與隕石坑，降低平鋪重複感 */
function soilMaterial(scene: Scene): StandardMaterial {
  const px = 1024;
  const tex = new DynamicTexture('ground-tex', px, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

  /** 底色：深鈷藍外星土 */
  ctx.fillStyle = '#16244a';
  ctx.fillRect(0, 0, px, px);

  /** 岩層明暗補丁（更深的藍黑陰影 / 偏亮的鈷藍隆起，打破單一色塊） */
  for (let k = 0; k < 16; k++) {
    const bx = Math.random() * px;
    const by = Math.random() * px;
    const r = 60 + Math.random() * 180;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    if (Math.random() > 0.5) {
      g.addColorStop(0, 'rgba(60,95,170,0.40)');
      g.addColorStop(1, 'rgba(60,95,170,0)');
    } else {
      g.addColorStop(0, 'rgba(8,14,32,0.45)');
      g.addColorStop(1, 'rgba(8,14,32,0)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** 礦物斑點（青藍/冷白晶體微光，星塵感） */
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(120,200,255,0.30)' : 'rgba(10,18,40,0.40)';
    ctx.fillRect(Math.random() * px, Math.random() * px, 2, 2);
  }

  /** 地殼龜裂（更深的藍黑鋸齒分支，岩石裂縫） */
  ctx.strokeStyle = 'rgba(6,10,26,0.55)';
  for (let k = 0; k < 12; k++) {
    let x = Math.random() * px;
    let y = Math.random() * px;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 7; s++) {
      x += (Math.random() - 0.5) * 160;
      y += (Math.random() - 0.5) * 160;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1 + Math.random() * 2.5;
    ctx.stroke();
  }

  /** 隕石坑（暗環＋亮緣，散落的衝擊坑） */
  for (let k = 0; k < 14; k++) {
    const cx = Math.random() * px;
    const cy = Math.random() * px;
    const cr = 8 + Math.random() * 26;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,10,24,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(90,140,210,0.30)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  tex.update();
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.uScale = 6;
  tex.vScale = 6;

  const material = new StandardMaterial('ground-material', scene);
  material.diffuseTexture = tex;
  material.specularColor = Color3.Black();
  /** 深鈷藍：冷色調染整片外星地表（與太空背景/霧一致） */
  material.diffuseColor = new Color3(0.34, 0.46, 0.78);
  return material;
}

/** 建立平整外星地表。 */
export function createTerrain(scene: Scene): Mesh {
  // 須涵蓋殭屍生成的東側角落（x 最遠約 66）→ 半徑需 ≥ 66
  const size = CONFIG.arenaHalf * 13;
  const ground = MeshBuilder.CreateGround('ground', { width: size, height: size }, scene);
  ground.material = soilMaterial(scene);
  ground.isPickable = false;
  return ground;
}
