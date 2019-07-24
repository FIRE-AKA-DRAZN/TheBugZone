#!/usr/bin/env node

const fs = require('fs')
const Papa = require('papaparse')
const table = require('./originals/_WEAPONTABLE')
const textTable = require('./originals/_WEAPONTEXT')
const blurbs = require('../helpers/blurbs')
const getId = require('../helpers/get-id')
const getNode = require('../helpers/get-node')
const patch = require('../helpers/patch')
const getMultiIndex = require('../helpers/get-multi-index')
const getIndex = require('../helpers/spread-sheet-index')

const rawSgos = new Map()
const seconds = 60
const minutes = seconds * 60

const added = {}

function Float(v) {
  return {type: 'float', value: v}
}

function Ptr(v) {
  return {type: 'ptr', value: v}
}

function Int(v) {
  return {type: 'int', value: v}
}

function Str(v) {
  return {type: 'string', value: v}
}

function Vector(v) {
  return Ptr(v.map(Float))
}

function acquire(file) {
  return JSON.parse(fs.readFileSync(file))
}

categories = {
  ranger: {
    assault: 0,
    shotguns: 1,
    sniper: 2,
    rocket: 3,
    homing: 4,
    grenade: 5,
    special: 6,
  },
  diver: {
    "short": 10,
    laser: 11,
    electro: 12,
    particle: 13,
    sniper: 14,
    explosive: 15,
    homing: 16,
    special: 17,
  },
  fencer: {
    hammer: 20,
    spear: 21,
    shield: 22,
    auto: 23,
    cannon: 24,
    homing: 25,
    special: 26,
  },
  raider: {
    guide: 30,
    raid: 31,
    support: 32,
    limpet: 33,
    deploy: 34,
    special: 35,
    tank: 36,
    ground: 37,
    heli: 38,
    mech: 39,
  },
}

function add(meta, changes) {
  for(const prop of ['id', 'soldier', 'category', 'level', 'base']) {
    if(!meta[prop]) throw new Error(`No ${prop} specified`)
  }
  if(!categories[meta.soldier]) {
    throw new Error(`
      Unknown soldier: ${meta.soldier}
      Valid soldiers: ${Object.keys(categories).join(', ')}
    `)
  }
  const category = categories[meta.soldier][meta.category]
  if(category == null) {
    throw new Error(`
      Unknown category: ${meta.soldier}: ${meta.category}
      Valid categories: ${Object.keys(categories[meta.soldier]).join(', ')}
    `)
  }
  console.log(`Processing ${meta.id} ...`)
  const weapon = acquire(`./originals/${meta.base.toUpperCase()}.json`)

  const name = ['name', {value: [Str(meta.name), Str(meta.name), Str(meta.name)]}]
  for(const [key, value] of Object.entries(changes).concat([name])) {
    var node = getNode(weapon, key)
    if(!node) {
      console.error(`Failed to find node ${key}, adding it...`)
      node = {name: key}
      weapon.variables.push(node)
    }
    if(typeof value === 'object') Object.assign(node, value)
    else if(typeof value === 'function') node.value = value(node.value, node)
    else node.value = value
  }

  const fileName = `${meta.soldier}_${meta.category}_${meta.id}`
  //const nameAffix = `_${meta.name}`

  added[fileName] = weapon
  weapon.meta.id = meta.id
  weapon.meta.level = meta.level
  weapon.meta.category = category
  weapon.meta.description = meta.description
  if(meta.stats) weapon.meta.stats = meta.stats
  if(meta.before) weapon.meta.before = meta.before
  else if(meta.after) weapon.meta.after = meta.after
}

const grenade = 'app:/WEAPON/bullet_grenade.rab'

//Load Rebalance stats from spreadsheet
const statsRaw = fs.readFileSync('./rebalance spreadsheets/EDF Weapon Balance - Gun Rebalance.csv', 'utf8')
const parsedStats = Papa.parse(statsRaw)
const sName = getIndex(parsedStats)

//See the spreadsheet for indexes: https://docs.google.com/spreadsheets/d/1ZcMneUf43jbCpKrSBvFZIcAq3WYP4qrdeNGkuvbcuco/edit#gid=1221405991&range=A96

var runOnce = false
for(let i = 0; i < parsedStats.data.length || runOnce === false; i++){
	//console.log("loop started")
	try{
		var step = i+1
		
		//Establish Weapon ID and find correct Row
		if(runOnce === false){
			var curWep = `NewWep${step}`
			var Stats = parsedStats.data.find(row => row[sName["ID"]] === curWep )
		}
		else{
			var curWep = `DupeWep${step}`
			var Stats = parsedStats.data.find(row => row[sName["DupeID"]] === curWep )
		}
		
		//Find Correct Meta
		if(runOnce === false){
			var curSoldier = Stats[sName["Soldier"]]
			var curCat = Stats[sName["OfficialCat"]]
			var curBase = Stats[sName["NewBase"]]
		}
		else{
			var curSoldier = Stats[sName["OfficalDupeSoldier"]]
			var curCat = Stats[sName["OfficalDupeCat"]]
			var curBase = Stats[sName["DupeBase"]]
		}
		
		//Filter After or Before Placement
		if(Stats[sName["PlaceAfter"]] === "FIRST"){
			curAfter = null
			curBefore = Stats[sName["PlaceBefore"]]
		}
		else{
			curAfter = Stats[sName["PlaceAfter"]]
			curBefore = null
    }
    
    //Ensure non-automatic Melee weapons are assigned a 1 for Fire Interval
    if(Stats[sName["Type"]] === "CC Striker" || Stats[sName["Type"]] === "CC Piercer" ){
      var realFireInterval = 1
    }
    else{
      var realFireInterval = +Stats[sName["AttackInterval"]]
    }
		
		
		add({
			id: curWep,			
			after: curAfter,
			before: curBefore,
			soldier: curSoldier,
			category: curCat,
      base: curBase,
      name: Stats[sName["NewName"]],
			//name: v => {
      //  v[0].value = Stats[sName["JapaneseName"]]
      //  v[1].value = Stats[sName["NewName"]]
      //  v[2].value = Stats[sName["ChineseName"]]
      //  console.log(v)
      //  return v
      //},
      level: +Stats[sName["Level"]],
      unlockState: +Stats[sName["UnlockState"]],
			description: Stats[sName["Description"]].replace(/\|/g, "\n"),
		},
		{
			//General Stats
			AmmoDamage: +Stats[sName["DamagePerHit"]],
			AmmoCount: +Stats[sName["AmmoCount"]],
			FireCount: +Stats[sName["FireCount"]],
			ReloadTime: +Stats[sName["ReloadTime"]],
			ReloadInit: +Stats[sName["StartingReloadFactor"]],
			ReloadType: +Stats[sName["ReloadType"]],
			AmmoAlive: +Stats[sName["AmmoLifetime"]],
      AmmoSpeed: +Stats[sName["AmmoSpeed"]],
      AmmoSize: +Stats[sName["AmmoSize"]],
			FireInterval: realFireInterval,
			FireBurstInterval: +Stats[sName["BurstInterval"]],
			FireBurstCount: +Stats[sName["BurstCount"]],
			Range: +Stats[sName["Range"]],
			AmmoHitImpulseAdjust: +Stats[sName["HitImpulseAdjust"]],
      AmmoExplosion: +Stats[sName["AreaOfEffect"]],
      AmmoIsPenetration: +Stats[sName["Piercing?"]],
			FireAccuracy: +Stats[sName["AccuracyReduction"]],
			FireSpreadType: +Stats[sName["SpreadType"]],
			FireSpreadWidth: +Stats[sName["FireSpreadWidth"]],
			AmmoHitSizeAdjust: +Stats[sName["AmmoHitboxAdjustment"]],
			AmmoGravityFactor: +Stats[sName["GravityFactor"]],
			AmmoOwnerMove: +Stats[sName["MovementInheritance"]],
			EnergyChargeRequire: +Stats[sName["EnergyChargeRequirement"]],
			//Lock On Stats
			LockonType:  +Stats[sName["LockOnActive"]],	
			LockonFailedTime:  +Stats[sName["LockOnFailedTime"]],
			LockonHoldTime:  +Stats[sName["LockOnHoldTime"]],
			LockonRange:  +Stats[sName["LockOnRange"]],
			LockonTargetType:  +Stats[sName["LockOnTargetType"]],
			LockonTime:  +Stats[sName["LockOnTime"]],
			Lockon_AutoTimeOut:  +Stats[sName["LockOnAutoTimeOut"]],
      Lockon_DistributionType:  +Stats[sName["LockOnDistributionType"]],
      //Secondary Fire
      SecondaryFire_Type: +Stats[sName["SecondaryFireType?"]],
      SecondaryFire_Parameter: (v, node) => {
        if(+Stats[sName["SecondaryFireType?"]] === 1 ){
          v = +Stats[sName["ZoomFactor"]]
          node.type = "float"
        }
        return v
      }, 
      
      
			
			//Lock Angle
			LockonAngle:  v => {
				v[0].value = +Stats[sName["LockOnAngleH"]]
				v[1].value = +Stats[sName["LockOnAngleV"]]
				return v
			},
			
			//Targeted Changes
			
			Ammo_CustomParameter: v => {
			
				if(Stats[sName["BombBullet?"]] === "Yes"){
					//Limpet Specific Parameters
					
						var node = v.find(node => node.name === 'IsDetector')
						node.value = +Stats[sName["Detector?"]]
						//console.log(node.value)		
						var node = v.find(node => node.name === 'BombExplosionType')
						node.value = +Stats[sName["ExplosionType"]]
						
					}
					//console.log("Limpet specific parameters applied successfuly")

				if(Stats[sName["RealExplosionType"]] === "Splendor"){
					//Splendor Specific Parameters
					
						var node = v.find(node => node.name === 'SplendorParameter')
						const FleCount = node.value.find(node => node.name === 'FlechetteCount')
						const FleLife = node.value.find(node => node.name === 'FlechetteAlive')
						const FleSpeed = node.value.find(node => node.name === 'FlechetteSpeed')
						const FleSize = node.value.find(node => node.name === 'FlechetteSize')
						//Spread Stuff
						const FleSpread = node.value.find(node => node.name === 'FlechetteSpread')
						const FleSpreadH = FleSpread.value.find(node => node.name === 'Horizontal')
						const FleSpreadV = FleSpread.value.find(node => node.name === 'Vertical')
						const FleSpreadVOff = FleSpread.value.find(node => node.name === 'VerticalOffset')
						const searchRange = node.value.find(node => node.name === 'SearchRange')					
						FleCount.value = +Stats[sName["FireHits"]]
						FleLife.value = +Stats[sName["SplendorLifetime"]]
						FleSpeed.value = +Stats[sName["SplendorSpeed"]]
						FleSize.value = +Stats[sName["SplendorSize"]]
						FleSpreadH.value = +Stats[sName["SplendorSpreadH"]]
						FleSpreadV.value = +Stats[sName["SplendorSpreadV"]]
						FleSpreadVOff.value = +Stats[sName["SplendorSpreadVOffset"]]
						searchRange.value = +Stats[sName["SecondarySearchRange"]]
						
					}
					//console.log("Splendor specific parameters applied successfuly")
				
				
				if(Stats[sName["Type"]] === "Ballistic"){
					
						const summonDelay = v[2]
						summonDelay.value = +Stats[sName["SummonLeadTime"]]
						const summonCustomParameter = v[4]
						const artilleryInterval = summonCustomParameter.value[3]
						const artilleryCount = summonCustomParameter.value[2]
						const artilleryExplosionRadius = summonCustomParameter.value[9]
						artilleryInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
						artilleryCount.value = +Stats[sName["SecondaryShotCount"]]
						artilleryExplosionRadius.value = +Stats[sName["SecondaryShotAoE"]]
						
					}
					//console.log("Ballistic Air Raid specific parameters applied successfuly")
				
				
				if(Stats[sName["Type"]] === "Bombing Plan"){
					
						const delay = v.find(node => node.name === 'SummonDelay')
						delay.value = +Stats[sName["SummonLeadTime"]]
						//Set bombing run Plane stats
						const planeStats = v.find(node => node.name === 'Summon_CustomParameter')
						const planeCount = planeStats.value.find(node => node.name === 'PlaneCount')
						const planeHeight = planeStats.value.find(node => node.name === 'PlaneElevation')
						const planeInterval = planeStats.value.find(node => node.name === 'PlaneInterval')
						const planeSpeed = planeStats.value.find(node => node.name === 'PlaneSpeed')
						planeCount.value = +Stats[sName["BombingPlanPlaneCount"]]
						planeHeight.value = +Stats[sName["BombingPlanPlaneHeight"]]
						planeInterval.value = +Stats[sName["BombingPlanPlaneInterval"]]
						planeSpeed.value = +Stats[sName["BombingPlanPlaneSpeed"]]
						
						//set bombing run bomb stats
						const bombingStats = planeStats.value.find(node => node.name === 'BombingPayloadParameter')
						const bombCount = bombingStats.value.find(node => node.name === 'BombingPayloadCount')
						const bombInterval = bombingStats.value.find(node => node.name === 'BombingPayloadInterval')
						const bombUpSpeed = bombingStats.value.find(node => node.name === 'BombingPayloadInitialUpSpeed')
						const bombSpeed = bombingStats.value.find(node => node.name === 'BombingPayloadSpeed')
						const bombExplosion = bombingStats.value.find(node => node.name === 'BombingPayloadExplosion')
						const bombLife = bombingStats.value.find(node => node.name === 'BombingPayloadAlive')
						bombCount.value = +Stats[sName["SecondaryShotCount"]]
						bombInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
						bombUpSpeed.value = +Stats[sName["BombingPlanInitialUpwardSpeed"]]
						bombSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
						bombExplosion.value = +Stats[sName["SecondaryShotAoE"]]
						bombLife.value = +Stats[sName["SecondaryProjectileLifetime"]]

						 
					
					//console.log("Bombing Plan Air Raid specific parameters applied successfuly")
				}			
				
				if(Stats[sName["Type"]] === "Target Painted"){
					
						const missileCount = v[4].value[2]
						const missileFireInterval = v[4].value[3]
						const missileSpeed = v[4].value[5]
						const missileSize = v[4].value[7]
						const missileExplosion = v[4].value[9]
						missileCount.value = +Stats[sName["SecondaryShotCount"]]
						missileFireInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
						missileSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
						missileSize.value = +Stats[sName["SecondaryProjectileSize"]]
						missileExplosion.value = +Stats[sName["SecondaryShotAoE"]]
						
						
					
					//console.log("Target Painted Air Raid specific parameters applied successfuly")
				}
				
				if(Stats[sName["Type"]] === "Auto Turret"){
					
						const turretFireRate = v.find(node => node.name === 'Ammo_CustomParameter')
						const turretAmmoCount = v.find(node => node.name === 'AmmoSize')
						const turretTracking = v.find(node => node.name === 'TurnSpeed')
						const turretSearchRange = v.find(node => node.name === 'SearchRange')
						const turretAmmoSpeed = v[13]
						turretFireRate.value = +Stats[sName["SecondaryProjectileInterval"]]
						turretAmmoCount.value = +Stats[sName["SecondaryAmmoCount"]]
						turretTracking.value = +Stats[sName["SecondaryTurnSpeed"]]
						turretSearchRange.value = +Stats[sName["SecondarySearchRange"]]
						turretAmmoSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
						
					
					//console.log("Turret specific parameters applied successfuly")
				}
				
				if(Stats[sName["Type"]] === "Napalm"){
					
						const napalmStats = v.find(node => node.name === 'EmitterParameter')
						const napalmHitCount = napalmStats.value.find(node => node.name === 'EmitterAmmoCount')
						const napalmHitInterval = napalmStats.value.find(node => node.name === 'EmitterInterval')
						napalmHitCount.value = +Stats[sName["SecondaryAmmoCount"]]
						napalmHitInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
						return v
						
					
				}
				
				if(Stats[sName["Type"]] === "Target Painter"){
					
						const lockSpeed = v[0].value
						const lockRange = v[1].value
						lockSpeed.value = +Stats[sName["SecondaryLockTime"]]
						lockRange.value = +Stats[sName["SecondaryLockRange"]]
						
					
				}
				
				if(Stats[sName["Type"]] === "Lock On Launcher"){
						
						const misAcel = v[4]
						const misTurn = v[5]
						const misMaxSpeed = v[6]
						const misIgniteDelay = v[7].value[0]
						const misFlyStraight = v[8]
						misAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
						misTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
						misMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
						misIgniteDelay.value = +Stats[sName["SecondaryEngineIgniteDelay"]]
						misFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]
						
				}	
				
				if(Stats[sName["Type"]] === "Homing Laser"){
						
						const laserAcel = v[3]
						const laserTurn = v[4]
						const laserMaxSpeed = v[5]
						const laserFlyStraight = v[6]
						laserAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
						laserTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
						laserMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
						laserFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]
						
        }
        
        if(Stats[sName["Type"]] === "Energy Cluster"){

            const spreadAngle = v[2]
            const spreadType = v[3]
            const fireCount = v[5].value[2]
            const fireInterval = v[5].value[3]
            const ammoSpeed = v[5].value[5]
            const shotAoE = v[5].value[9]
            const ammoLifetime = v[5].value[10]
  
            spreadAngle.value = +Stats[sName["SecondarySpreadAngle"]]
            spreadType.value = +Stats[sName["SecondarySpreadTypeFlag"]]
            fireCount.value = +Stats[sName["SecondaryAmmoCount"]]
            fireInterval.value = Stats[sName["SecondaryProjectileInterval"]]-1
            ammoSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
            shotAoE.value = +Stats[sName["SecondaryShotAoE"]]
            ammoLifetime.value = +Stats[sName["SecondaryProjectileLifetime"]]
  
        }
				
				// if(Stats[sName["Type"]] === "Lightning"){
				
					// const lightNoise = v[0].value
					// const lightRandVel = v[1].value
					// const lightCurve = v[2].value
					// const lightMod = v[3].value
					// lightNoise.value = 1
					// lightRandVel.value = 0
					// lightCurve.value = 0
					// lightMod.value = 1
				
				// }
				
				return v
      },
      custom_parameter: v => {

        if(Stats[sName["Type"]] === "CC Piercer"){

            const a1animation = v[0].value[0].value[0]
            const a1animMult = v[0].value[0].value[1]
            const a1dmgMult = v[0].value[0].value[2]
            const a1ammoSizeMult = v[0].value[0].value[3]
            const a1ammoLifeMult = v[0].value[0].value[4]
  
            a1animation.value = Stats[sName["AttackOneAnimationType"]]
            a1animMult.value = +Stats[sName["AttackOneAnimationSpeedMult"]]
            a1dmgMult.value = +Stats[sName["AttackOneDamageMult"]]
            a1ammoSizeMult.value = +Stats[sName["AttackOneAmmoSizeMult"]]
            a1ammoLifeMult.value = +Stats[sName["AttackOneAmmoLifeMult"]]
  
            if(+Stats[sName["NumOfAttacks"]] >= 2){

              const a2animation = v[0].value[1].value[0]
              const a2animMult = v[0].value[1].value[1]
              const a2dmgMult = v[0].value[1].value[2]
              const a2ammoSizeMult = v[0].value[1].value[3]
              const a2ammoLifeMult = v[0].value[1].value[4]
  
              a2animation.value = Stats[sName["AttackTwoAnimationType"]]
              a2animMult.value = +Stats[sName["AttackTwoAnimationSpeedMult"]]
              a2dmgMult.value = +Stats[sName["AttackTwoDamageMult"]]
              a2ammoSizeMult.value = Stats[sName["AttackTwoAmmoSizeMult"]]
              a2ammoLifeMult.value = Stats[sName["AttackTwoAmmoLifeMult"]]
            }

            if(+Stats[sName["NumOfAttacks"]] === 3){

              const a3animation = v[0].value[2].value[0]
              const a3animMult = v[0].value[2].value[1]
              const a3dmgMult = v[0].value[2].value[2]
              const a3ammoSizeMult = v[0].value[2].value[3]
              const a3ammoLifeMult = v[0].value[2].value[4]
  
              a3animation.value = Stats[sName["AttackThreeAnimationType"]]
              a3animMult.value = +Stats[sName["AttackThreeAnimationSpeedMult"]]
              a3dmgMult.value = +Stats[sName["AttackThreeDamageMult"]]
              a3ammoSizeMult.value = +Stats[sName["AttackThreeAmmoSizeMult"]]
              a3ammoLifeMult.value = +Stats[sName["AttackThreeAmmoLifeMult"]]
            }

          }
  
        if(Stats[sName["Type"]] === "Spine Driver"){

            const a1animation = v[0].value[0].value[0]
            const a1animMult = v[0].value[0].value[1]
            const a1dmgMult = v[0].value[0].value[2]
            const a1ammoSizeMult = v[0].value[0].value[3]
            const a1ammoLifeMult = v[0].value[0].value[4]
  
            a1animation.value = Stats[sName["AttackOneAnimationType"]]
            a1animMult.value = Stats[sName["AttackOneAnimationSpeedMult"]]
            a1dmgMult.value = Stats[sName["AttackOneDamageMult"]]
            a1ammoSizeMult.value = Stats[sName["AttackOneAmmoSizeMult"]]
            a1ammoLifeMult.value = Stats[sName["AttackOneAmmoLifeMult"]]       
          }
  
        if(Stats[sName["Type"]] === "CC Striker"){

            const dmgReduction = v[2]
            dmgReduction.type = "float"
            dmgReduction.value = +Stats[sName["DamageTakenMultiplier"]]
            
            const a1chargeFrames = v[3].value[0].value[0]
            const a1animation = v[3].value[0].value[1]
            const a1animMult = v[3].value[0].value[2]
            const a1dmgMult = v[3].value[0].value[3]
            const a1ammoSizeMult = v[3].value[0].value[4]
            const a1ammoLifeMult = v[3].value[0].value[5]
  
            a1chargeFrames.value = +Stats[sName["AttackOneChargeFrames"]]
            a1animation.value = Stats[sName["AttackOneAnimationType"]]
            a1animMult.value = +Stats[sName["AttackOneAnimationSpeedMult"]]
            a1dmgMult.value = +Stats[sName["AttackOneDamageMult"]]
            a1ammoSizeMult.value = +Stats[sName["AttackOneAmmoSizeMult"]]
            a1ammoLifeMult.value = +Stats[sName["AttackOneAmmoLifeMult"]]
  
            if(+Stats[sName["NumOfAttacks"]] >= 2){
              const a2chargeFrames = v[3].value[1].value[0]
              const a2animation = v[3].value[1].value[1]
              const a2animMult = v[3].value[1].value[2]
              const a2dmgMult = v[3].value[1].value[3]
              const a2ammoSizeMult = v[3].value[1].value[4]
              const a2ammoLifeMult = v[3].value[1].value[5]
              const a2fireSpread = v[4].value[1].value[2]
              
              if (v[3].value[1].value[7] === undefined){
                v[3].value[1].value[7] = {"type":"int","value":1}
                v[3].value[1].value[8] = {"type":"float","value":1}
                v[3].value[1].value[9] = {"type":"float","value":0}
              }
              const a2fireCount = v[3].value[1].value[7]
              const a2fireAngle = v[3].value[1].value[9]            
    
              a2chargeFrames.value = +Stats[sName["AttackTwoChargeFrames"]]
              a2animation.value = Stats[sName["AttackTwoAnimationType"]]
              a2animMult.value = +Stats[sName["AttackTwoAnimationSpeedMult"]]
              a2dmgMult.value = +Stats[sName["AttackTwoDamageMult"]]
              a2ammoSizeMult.value = +Stats[sName["AttackTwoAmmoSizeMult"]]
              a2ammoLifeMult.value = +Stats[sName["AttackTwoAmmoLifeMult"]]
              a2fireCount.value = +Stats[sName["AttackTwoFireCount"]]
              a2fireAngle.value = +Stats[sName["AttackTwoFireAngle"]]
              a2fireSpread.value = +Stats[sName["AttackTwoFireSpread"]]
            }
            
            if(+Stats[sName["NumOfAttacks"]] === 3){
              const a3chargeFrames = v[3].value[2].value[0]
              const a3animation = v[3].value[2].value[1]
              const a3animMult = v[3].value[2].value[2]
              const a3dmgMult = v[3].value[2].value[3]
              const a3ammoSizeMult = v[3].value[2].value[4]
              const a3ammoLifeMult = v[3].value[2].value[5]
              const a3fireSpread = v[4].value[2].value[2]
              
              if (v[3].value[2].value[7] === undefined){
                v[3].value[2].value[7] = {"type":"int","value":1}
                v[3].value[2].value[8] = {"type":"float","value":1}
                v[3].value[2].value[9] = {"type":"float","value":0}
              }
              const a3fireCount = v[3].value[2].value[7]
              const a3fireAngle = v[3].value[2].value[9]
              
    
              a3chargeFrames.value = +Stats[sName["AttackThreeChargeFrames"]]
              a3animation.value = Stats[sName["AttackThreeAnimationType"]]
              a3animMult.value = +Stats[sName["AttackThreeAnimationSpeedMult"]]
              a3dmgMult.value = +Stats[sName["AttackThreeDamageMult"]]
              a3ammoSizeMult.value = +Stats[sName["AttackThreeAmmoSizeMult"]]
              a3ammoLifeMult.value = +Stats[sName["AttackThreeAmmoLifeMult"]]
              a3fireCount.value = +Stats[sName["AttackThreeFireCount"]]
              a3fireAngle.value = +Stats[sName["AttackThreeFireAngle"]]
              a3fireSpread.value = +Stats[sName["AttackThreeFireSpread"]]
            }
        }
        return v
      }
			
		})

	}
	catch(error){
    try{
      newName = Stats[sName["NewName"]]
    }
    catch{
      newName = null
    }
    if (newName != null) {
      console.log("Weapon '",newName,"' with ID",`NewWep${step}`,"has encountered an Error:")
      console.log(error.stack)
    }

	}
	if(i === parsedStats.data.length && runOnce === false){
		console.log("Resetting Loop...")
		i = 0
		runOnce = true
	}
}

// EX (Explosive assault rifles)
for(let i = 0; i < 12; i++) {
  const factor = i + 1
  Stats = parsedStats.data.find(row => row[sName["ID"]] === `RarEx${factor}` )
  add({
    id: `RarEx${factor}`,
    after: Stats[sName["PlaceAfter"]],
    soldier: Stats[sName["Soldier"]],
    category: Stats[sName["OfficialCat"]],
    base: Stats[sName["NewBase"]],
    name: Stats[sName["NewName"]],
    level: +Stats[sName["Level"]],
	  description: Stats[sName["Description"]].replace(/\|/g, "\n"),
  }, {
    AmmoDamage: +Stats[sName["DamagePerHit"]],
    AmmoClass: 'GrenadeBullet01',
    AmmoModel: Str(grenade),
    AmmoAlive: +Stats[sName["AmmoLifetime"]],
    AmmoSpeed: +Stats[sName["AmmoSpeed"]],
    AmmoCount: +Stats[sName["AmmoCount"]],
    AmmoExplosion: +Stats[sName["AreaOfEffect"]],
    AmmoColor: Vector([
      (0.3 * factor)/3,
      (0.1 * 3 * factor)/3,
      (0.6 * 2 * factor)/3,
      1.0,
    ]),
    Ammo_CustomParameter: Ptr([
      Int(1), // Sticky Grenade
      Float(-0.004),
      Float(1 + i),
      Float(0),
      Float(0.12), // Smoke trail speed
      Int(60), // Smoke Lifetime
    ]),
    AmmoHitImpulseAdjust: +Stats[sName["HitImpulseAdjust"]],
    Range: +Stats[sName["Range"]],
    ReloadTime: +Stats[sName["ReloadTime"]],
    FireAccuracy: +Stats[sName["AccuracyReduction"]],
    FireInterval: +Stats[sName["AttackInterval"]],
    resource: v => {
      v.push(Str(grenade))
      return v
    },
  })
}

// Personal Guide Kit (Guide kits for Fencer)
const laserGuide = {
  AmmoAlive: 1,
  AmmoCount: 1,
  AmmoClass: '',
  AmmoDamage: 0,
  AmmoModel: Int(0),
  FireAccuracy: 0,
  FireBurstCount: 1,
  FireInterval: 0,
  FireSe: Ptr([
    Int(1),
    Str('weapon_Engineer_LM_laserMark'),
    Float(0.7),
    Float(1),
    Float(1),
    Float(25),
  ]),
  ReloadTime: 0,
  SecondaryFire_Type: 1,
  SecondaryFire_Parameter: Float(3),
  xgs_scene_object_class: 'Weapon_LaserMarker',
}

for(let i = 0; i < 3; i++) {
  const range = 300 + 50 * i
  const distance = [0.2, 0.5, 1][i]
  const speed = [0.2, 0.5, 0.8][i]

  add({
    id: `FspLaserGuide${i + 1}`,
    after: [
      'Weapon507',
      'FspLaserGuide1',
      'FspLaserGuide2',
    ][i],
    soldier: 'fencer',
    category: 'special',
    base: 'Weapon431',
    name: `Personal Guide Kit` + (i ? ` M${i + 1}` : ''),
    level: [20, 60, 76][i],
    stats: [
      ['Laser Range', `${range}m`],
      ['Lock-On Distance', `${distance}x`],
      ['Lock-On Speed', `${speed}x`],
      ['Zoom', '3x'],
    ],
    description: [
      '$SEMISTATS$A shoulder-mounted laser guide Fencers can use to guide their own missiles.',
      'Being shoulder-mounted, the laser is not as stable as the dedicated pointers used by Air Raiders, as such the targets will be more difficult than usual to lock on for missiles.',
    ].join('\n\n'),
  }, Object.assign({}, laserGuide, {
    AmmoColor: Vector([0.25, 1.0, 0.25, 1.0]),
    AmmoSpeed: range,
    Ammo_CustomParameter: Vector([speed, distance]),
    Range: range,
    SecondaryFire_Parameter: Float(3),
  }))
}

add({
  id: 'FspLaserGuideA',
  after: 'FspLaserGuide1',
  soldier: 'fencer',
  category: 'special',
  base: 'Weapon431',
  name: 'Focus Pointer',
  level: 28,
  stats: [
    ['Laser Range', '160m'],
    ['Lock-On Distance', '0.5x'],
    ['Lock-On Speed', '2x'],
  ],
  description: [
    '$SEMISTATS$A shoulder-mounted laser guide Fencers can use to guide their own missiles.',
    'The problem of instability has been solved by using multiple lasers and triangulating the positions between them, but the range suffers, and the missile launcher must be used from very close by.',
  ].join('\n\n'),
}, Object.assign({}, laserGuide, {
  AmmoColor: Vector([1.0, 0.25, 0.25, 1.0]),
  AmmoSpeed: 160,
  Ammo_CustomParameter: Vector([2, 0.5]),
  Range: 160,
  SecondaryFire_Parameter: Float(3),
}))

const beaconGuide = {
  AmmoClass: 'TargetMarkerBullet01',
  AmmoHitSe: Ptr([
    Int(0),
    Str('weapon_Engineer_LM_set'),
    Float(0.7),
    Float(1),
    Float(1),
    Float(35),
  ]),
  AmmoModel: Str('app:/WEAPON/bullet_marker.rab'),
  AmmoGravityFactor: 1,
  resource: (v, node) => {
    node.type = 'ptr'
    if(!v) {
      node.value = []
      v = node.value
    }
    v.push(Str('app:/WEAPON/bullet_marker.rab'))
    return v
  },
}

// Personal Guide Beacon (Fencer)
for(let i = 0; i < 3; i++) {
  const life = 400
  const speed = 1 + i * 0.25
  const rangeMod = [0.5, 0.6, 1][i]
  const speedMod = [0.3, 0.4, 1][i]
  const range = speed * life

  add({
    id: `FspSphereGuide${i + 1}`,
    after: [
      'FspLaserGuide3',
      'FspSphereGuide1',
      'FspSphereGuide2',
    ][i],
    soldier: 'fencer',
    category: 'special',
    base: 'Weapon474',
    name: `Personal Guide Beacon` + (i ? ` M${i + 1}` : ''),
    level: [4, 24, 82][i],
    stats: [
      ['Range', `${range}m`],
      ['Lock-On Distance', `${rangeMod}x`],
      ['Lock-On Speed', `${speedMod}x`],
      ['Reload', '8sec'],
    ],
    description: [
      '$SEMISTATS$A shoulder-mounted guide beacon launcher Fencers can use to guide their own missiles.',
      'As the size of the beacons had to be reduced, they\'re not as strong as Air Raider\'s beacons.',
      blurbs.jump,
    ].join('\n\n'),
  }, Object.assign({}, beaconGuide, {
    AmmoAlive: life,
    AmmoColor: Vector([0.0, 1.0, 0.0, 1.0]),
    AmmoSpeed: speed,
    AmmoSize: 0.05,
    AmmoCount: 3,
    Ammo_CustomParameter: Vector([speedMod, rangeMod, 1]),
    FireAccuracy: 0.12 - i * 0.03,
    MuzzleFlash: '',
    MuzzleFlash_CustomParameter: Ptr(null),
    Range: range,
    ReloadTime: 8 * seconds,
    SecondaryFire_Type: 4
  }))
}

// Trap Mortar
for(let i = 0; i < 3; i++) {
  const fuse = i + 2
  const ammo = [10, 3, 5][i]
  const radius = [15, 30, 40][i]
  const damage = [1200, 4500, 9000][i]
  const factor = i + 1
  add({
    id: `FspTrapMortar${factor}`,
    after: [
      'FspLaserGuide3',
      'FspTrapMortar1',
      'FspTrapMortar2',
    ][i],
    soldier: 'fencer',
    category: 'special',
    base: 'Weapon457',
    name: `Trap Mortar B${[15, 24, 60][i]}`,
    level: [33, 46, 66][i],
    stats: [
      ['Capacity', `${ammo}`],
      ['Damage', `${damage}`],
      ['Blast Radius', `${radius}m`],
      ['Detonation Time', `${fuse}sec`],
      ['Reload Time', `10sec`],
    ],
    description: [
      '$SEMISTATS$A device that leaves powerful, timed bombs at the user\'s position. Designed to help the user escape giant from insects.',
      'After planting, it\'s important to leave the blast area as fast as possible.',
      blurbs.dash,
    ].join('\n\n'),
  }, {
    AmmoDamage: damage,
    AmmoClass: 'GrenadeBullet01',
    AmmoModel: Str(grenade),
    AmmoAlive: fuse * seconds,
    AmmoSpeed: 0,
    AmmoCount: ammo,
    AmmoExplosion: radius,
    AmmoColor: Vector([
      0.1 * 3 * factor,
      0.6 * 2 * factor,
      0.3 * factor,
      1.0,
    ]),
    Ammo_CustomParameter: Ptr([
      Int(1), // Sticky Grenade
      Float(-0.004),
      Float(1 + i),
      Float(0.2),
      Float(0.3), // Smoke trail speed
      Int(60), // Smoke Lifetime
    ]),
    AmmoHitImpulseAdjust: 3 + i * 2,
    AmmoGravityFactor: 2,
    Range: 1000,
    ReloadTime: 8 * seconds,
    FireAccuracy: 0.2,
    FireInterval: 45,
    FireVector: Vector([0, -1, 0]),
    SecondaryFire_Type: 5,
    resource: (v, node) => {
      node.type = 'ptr'
      if(!v) {
        node.value = []
        v = node.value
      }
      v.push(Str(grenade))
      return v
    },
  })
}

// Precision Gatling
for(let i = 0; i < 12; i++) {
	Stats = parsedStats.data.find(row => row[sName["ID"]] === `FatPrecGat${i + 1}` )
  add({
    id: `FatPrecGat${i + 1}`,
    after: Stats[sName["PlaceAfter"]],
    soldier: 'fencer',
    category: 'auto',
    base: Stats[sName["NewBase"]],
	  name: Stats[sName["NewName"]],
    level: +Stats[sName["Level"]],
    description: Stats[sName["Description"]].replace(/\|/g, "\n"), 
  }, {
    AmmoDamage: +Stats[sName["DamagePerHit"]],
    AmmoAlive: +Stats[sName["AmmoLifetime"]],
    AmmoSpeed: +Stats[sName["AmmoSpeed"]],
    AmmoCount: +Stats[sName["AmmoCount"]],
    FireAccuracy: +Stats[sName["AccuracyReduction"]],
    FireInterval: +Stats[sName["AttackInterval"]],
	ReloadTime: +Stats[sName["ReloadTime"]],
	AmmoGravityFactor: +Stats[sName["GravityFactor"]],
	AmmoHitImpulseAdjust: +Stats[sName["HitImpulseAdjust"]],
	AmmoSpeed: +Stats[sName["AmmoSpeed"]],
    FireRecoil: 0,
    custom_parameter: v => {
      v[4].value[0].value = 0
      v[7].value = Math.floor(v[7].value * 0.5)
      return v
    },
  })
}

// Spritefall Pulse
for(let i = 0; i < 12; i++) {
  Stats = parsedStats.data.find(row => row[sName["ID"]] === `AraSpritefallBeta${i + 1}` )
  add({
    id: `AraSpritefallBeta${i + 1}`,
    after: Stats[sName["PlaceAfter"]],
    soldier: 'raider',
    category: 'raid',
    base: Stats[sName["NewBase"]],
	  name: Stats[sName["NewName"]],
    level: +Stats[sName["Level"]],
    description: Stats[sName["Description"]].replace(/\|/g, "\n"), 
  }, {
    AmmoDamage: +Stats[sName["DamagePerHit"]],
    AmmoExplosion: +Stats[sName["AreaOfEffect"]],
    AmmoSize: +Stats[sName["SecondaryProjectileSize"]],
	AmmoCount: +Stats[sName["AmmoCount"]],
    Ammo_CustomParameter: v => {
      v[0].value = +Stats[sName["SummonLeadTime"]] // Summon delay
      v[4].value[2].value = +Stats[sName["SecondaryShotCount"]] // Laser count
      return v
    },
    custom_parameter: v => {
      v[0].value = 30 // Call-in time
      return v
    },
    ReloadTime: +Stats[sName["ReloadTime"]],
	ReloadInit: +Stats[sName["StartingReloadFactor"]],
	EnergyChargeRequire: +Stats[sName["EnergyChargeRequirement"]],
	SecondaryFire_Type: +Stats[sName["SecondaryFireType?"]],
	SecondaryFire_Parameter: +Stats[sName["ZoomFactor"]],
  })
}

// Personal Defense Shotgun for Air Raider
for(let i = 0; i < 4; i++) {
  add({
    id: `AspShotgun${i + 1}`,
    before: 'Weaponn674',
    soldier: 'raider',
    category: 'special',
    base: 'Weapon032',
    name: [
      'Buckdeer 12Y',
      'Buckdeer 15Y',
      'Buckdeer 18Y',
      'Buckdeer XY',
    ][i],
    level: [2, 26, 50, 90][i],
    description: '$AUTOSTATS$A personal self-defense shotgun that\'s easy to handle for an untrained soldier. Handy for escaping the clutches of giant insects or finishing off what remains after the air raids have scorched the battlefield.',
  }, {
    AmmoAlive: Math.floor(10 - i * 1.5),
    AmmoDamage: [20, 40, 100, 200][i],
    AmmoCount: 2,
    AmmoSpeed: 3 * (i + 1),
    BaseAnimation: 'assault',
    ChangeAnimation: 'assault_change1',
    FireAccuracy: 0.3,
    FireCount: [20, 26, 32, 48][i],
    FireInterval: 45,
    FireSpreadType: 0,
    ReloadAnimation: 'assault_reload1',
    ReloadTime: 240,
  })
}

Stats = parsedStats.data.find(row => row[sName["ID"]] === `AraWarHammer1` )
add({
  id: `AraWarHammer1`,
  after: Stats[sName["PlaceAfter"]],
  soldier: 'raider',
  category: 'raid',
  base: 'Weapon584',
  name: 'Tungsten Tempest',
  level: +Stats[sName["Level"]],
  description: Stats[sName["Description"]].replace(/\|/g, "\n"), 
}, 
{
  AmmoDamage: +Stats[sName["DamagePerHit"]],
  AmmoExplosion: 4,
  Ammo_CustomParameter: v => {
    v[0].value = 240 // Summon  delay
    v[4].value[1].value[1].value = 800 // Missile spawn height
    v[4].value[5].value = 5 // Missile Speed
    v[4].value[7].value = 50 // Missile Size
    v[4].value[9].value = 10 // Explosive radius
    // Looking for ways to make meaningfully faster
    v[4].value[10].value /= 2
    v[4].value[13].value[2].value /= 4
    v[4].value[13].value[8].value /= 4
    return v
  },
  ReloadTime: +Stats[sName["ReloadTime"]],
  custom_parameter: v => {
    v[0].value = 30 // Summon time
    return v
  },
})

function json(obj) {
  return JSON.stringify(obj, null, 2)
}

//const outDir = './release/sgottstrap/SgottTemplates/weapon'
const outDir = 'C:/Program Files (x86)/Steam/steamapps/common/Earth Defense Force 4.1/SgottTemplates/weapon'
for(const [fileName, template] of Object.entries(added)) {
  const path = `${outDir}/${fileName}.json`
  //console.log(`Writing ${fileName}`)
  fs.writeFileSync(path, json(template))
}

console.log("Done!")
