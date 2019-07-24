#!/usr/bin/env node

const fs = require('fs')
const Papa = require('papaparse')
const table = require('./originals/_WEAPONTABLE')
const textTable = require('./originals/_WEAPONTEXT')
const blurbs = require('../helpers/blurbs')
const getId = require('../helpers/get-id')
const getNode = require('../helpers/get-node')
const patch = require('../helpers/patch')
const getIndex = require('../helpers/spread-sheet-index')

const rawSgos = new Map()
const seconds = 60
const minutes = seconds * 60

const modded = new Set()

var skipped = 0
var success = 0

const weaponByCat = {
	0: "Assault Rifles",
	1: "Shotguns",
	2: "Sniper Rifles",
	3: "Rocket Launchers",
	4: "Missile Launchers",
	5: "Grenades",
	6: "Special Weapons (Ranger)",
	10: "Short Range Lasers",
	11: "Laser Rifles",
	12: "Mid-Rg Electroshock",
	13: "Particle Cannons",
	14: "Precision Energy",
	15: "Plasma Launchers",
	16: "Homing Energy",
	17: "Special Weapons (Wing Diver)",
	20: "Close Cmbt Strikers",
	21: "Close Cmbt Piercers",
	22: "Shields",
	23: "Heavy Auto Weapons",
	24: "Fire Support",
	25: "Heavy Missiles",
	26: "Special Weapons (Fencer)",
	30: "Guidance Equipment",
	31: "Air Raids",
	32: "Support Equipment",
	33: "Personal Defence",
	34: "Stationary Weapons",
	35: "Special Equipment",
	36: "Tanks",
	37: "Ground Vehicles",
	38: "Helicopters",
	39: "Mechs"
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function replaceText(textNode, pattern, replacement) {
  textNode.value[3].value = textNode.value[3].value.replace(pattern, replacement)
}

function rebalance(query, cb) {
  table.variables[0]
    .value
    .filter(({value: node}, i) => {
      if(query.id && query.id !== node[0].value) return false
      if(query.category != null) { // Category is present, evaluate
		const category = node[2].value
		const queried = query.category
		//if(Array.isArray(queried)) console.log({category, queried})
		if(Array.isArray(queried)) {
		  if(!queried.includes(category)) return false
		  } else if(queried !== category) {
			return false
		  }
		}
      if(query.name) {
        const name = textTable.variables[0].value[i].value[2].value
        if(typeof query.name === 'string' && name !== query.name) return false
        if(query.name.test && !query.name.test(name)) return false
      }
      return true
    })
    .forEach((node, i) => {
      const path = `./originals/${getId(node).toUpperCase()}`
      const template = require(path)
      const text = textTable.variables[0].value[table.variables[0].value.indexOf(node)]
      modded.add(node)
      cb(template, i, node, text)
    })
}

function assign(property, value) {
  return function(template) {
    patch(template, property, value)
  }
}

function sprdSheetRebalance(targetCategory, sheet){
	console.log("\nBeginning rebalance of:",weaponByCat[targetCategory],"\n- - - - - - - - - -")
	rebalance({category: targetCategory}, (template, i, meta, text) => {
		//TRY START
		try{
			//console.log(getId(meta))
			var Stats = parsedStats.data.find(row => row[sName["ID"]] === getId(meta) )
			//console.log("Beginning rebalance of",Stats[sName["NewName"]],"...")
			//Standard Weapon Parameters
			//console.log("meta pre assign: ",meta)
			//console.log("Assignment value check: ",(Stats[1]/25))
			//Assign Level
			meta.value[4].value = Stats[sName["Level"]] / 25
			//if(Stats[sName["PlaceAfter"]] === "FIRST"){
			//	template.meta.after = null			}
			
			//console.log(parsedStats.data[2],"\n",Stats)
			
			if(Stats[sName["PlaceAfter"]] != "START"){
				
				template.meta.after = Stats[sName["PlaceAfter"]]
			}
			else{
				template.meta.before = Stats[sName["PlaceBefore"]]
			}

			template.meta.category = +Stats[sName["NewCategory"]]
			template.meta.unlockState = +Stats[sName["UnlockState"]]
			//console.log("meta post assign: ",meta)
			//console.log("Damage:",+Stats[sName["DamagePerHit"]])
			patch(template, 'AmmoDamage',  +Stats[sName["DamagePerHit"]])
			patch(template, 'AmmoCount',  +Stats[sName["AmmoCount"]])
			patch(template, 'AmmoExplosion',  +Stats[sName["AreaOfEffect"]])
			patch(template, 'FireCount',  +Stats[sName["FireCount"]])
			patch(template, 'FireBurstCount',  +Stats[sName["BurstCount"]])  
			patch(template, 'AmmoSpeed',  +Stats[sName["AmmoSpeed"]])
			patch(template, 'FireInterval',  +Stats[sName["AttackInterval"]])
			patch(template, 'FireBurstInterval',  +Stats[sName["BurstInterval"]])  
			patch(template, 'Range',  +Stats[sName["Range"]])
			patch(template, 'ReloadTime',  +Stats[sName["ReloadTime"]])
			patch(template, 'ReloadType', +Stats[sName["ReloadType"]])
			patch(template, 'AmmoAlive',  +Stats[sName["AmmoLifetime"]])
			patch(template, 'FireAccuracy',  +Stats[sName["AccuracyReduction"]])
			patch(template, 'AmmoGravityFactor',  +Stats[sName["GravityFactor"]])
			patch(template, 'AmmoHitImpulseAdjust',  +Stats[sName["HitImpulseAdjust"]])  
			patch(template, 'AmmoOwnerMove', +Stats[sName["MovementInheritance"]])
			patch(template, 'AmmoSize',  +Stats[sName["AmmoSize"]])
			patch(template, 'AmmoIsPenetration',  +Stats[sName["Piercing?"]])
			patch(template, 'EnergyChargeRequire', +Stats[sName["EnergyChargeRequirement"]])
			patch(template, 'FireSpreadType',  +Stats[sName["SpreadType"]])
			patch(template, 'FireSpreadWidth',  +Stats[sName["FireSpreadWidth"]])
			patch(template, 'AmmoHitSizeAdjust',  +Stats[sName["AmmoHitboxAdjustment"]])
			patch(template, 'ReloadInit',  +Stats[sName["StartingReloadFactor"]])
			
			//Lock On Parameters
			patch(template, 'LockonType',  +Stats[sName["LockOnActive"]])			
			patch(template, 'LockonFailedTime',  +Stats[sName["LockOnFailedTime"]])
			patch(template, 'LockonHoldTime',  +Stats[sName["LockOnHoldTime"]])
			patch(template, 'LockonRange',  +Stats[sName["LockOnRange"]])
			patch(template, 'LockonTargetType',  +Stats[sName["LockOnTargetType"]])
			patch(template, 'LockonTime',  +Stats[sName["LockOnTime"]])
			patch(template, 'Lockon_AutoTimeOut',  +Stats[sName["LockOnAutoTimeOut"]])
			patch(template, 'Lockon_DistributionType',  +Stats[sName["LockOnDistributionType"]])
			//Lock Angle
			patch(template, 'LockonAngle',  v => {
				v[0].value = +Stats[sName["LockOnAngleH"]]
				v[1].value = +Stats[sName["LockOnAngleV"]]
				return v
      })
      
      //Fire Vector
      if(Stats[sName["VectorSetting"]] === "Custom" ){
        patch(template, 'FireVector', [{
          type: 'float',
          value: +Stats[sName["FireVectorX"]],
          }, {
          type: 'float',
          value: +Stats[sName["FireVectorZ"]],
          }, {
          type: 'float',
          value: +Stats[sName["FireVectorY"]],
        }])
      }

			
			//Secondary Fire Parameters
			patch(template, 'SecondaryFire_Type', +Stats[sName["SecondaryFireType?"]])  
			if(+Stats[sName["SecondaryFireType?"]] === 1 ){
				patch(template, 'SecondaryFire_Parameter', (v, node) => {
				node.type = 'float'
				return +Stats[sName["ZoomFactor"]]
				})
			}
			//console.log("Standard weapon parameters applied successfully")
			//Weapon Name Settings   
			patch(template, 'name',  v => {
				const eng = v.find(node => node.name === 'English')
				const jap = v.find(node => node.name === 'Japanese')
				const china = v.find(node => node.name === 'Chinese')
				eng.value = Stats[sName["NewName"]]
				//console.log(Stats[sName["NewName"]])
				jap.value = Stats[sName["JapaneseName"]]
				china.value = Stats[sName["ChineseName"]]
				return v
			})
			//Set Weapon Description
			text.value[3].value = Stats[sName["Description"]].replace(/\|/g, "\n")
			//console.log("Name and Description applied successfully")


			//TARGETED CHANGES START
			
			if(Stats[sName["BombBullet?"]] === "Yes"){
				//Limpet Specific Parameters
				patch(template, 'Ammo_CustomParameter',  v => {
					const node = v.find(node => node.name === 'IsDetector')
					node.value = +Stats[sName["Detector?"]]
					//console.log(node.value)
					return v
				})  
				patch(template, 'Ammo_CustomParameter',  v => {
					const node = v.find(node => node.name === 'BombExplosionType')
					   node.value = +Stats[sName["ExplosionType"]]
					return v
				})
				//console.log("Limpet specific parameters applied successfuly")
			}

			if(Stats[sName["RealExplosionType"]] === "Splendor"){
				//Splendor Specific Parameters
				patch(template, 'Ammo_CustomParameter',  v => {
					const node = v.find(node => node.name === 'SplendorParameter')
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
					return v
				})
				//console.log("Splendor specific parameters applied successfuly")
			}
			
			if(Stats[sName["Type"]] === "Ballistic"){
				patch(template, 'Ammo_CustomParameter', v => {
					const summonDelay = v[2]
					summonDelay.value = +Stats[sName["SummonLeadTime"]]
					const summonCustomParameter = v[4]
					const artilleryInterval = summonCustomParameter.value[3]
					const artilleryCount = summonCustomParameter.value[2]
					const artilleryExplosionRadius = summonCustomParameter.value[9]
					artilleryInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
					artilleryCount.value = +Stats[sName["SecondaryShotCount"]]
					artilleryExplosionRadius.value = +Stats[sName["SecondaryShotAoE"]]
					return v
				})
				//console.log("Ballistic Air Raid specific parameters applied successfuly")
			}
			
			if(Stats[sName["Type"]] === "Bombing Plan"){
				patch(template, 'Ammo_CustomParameter', v => {
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

					return v 
				})
				//console.log("Bombing Plan Air Raid specific parameters applied successfuly")
			}			
			
			if(Stats[sName["Type"]] === "Target Painted"){
				patch(template, 'Ammo_CustomParameter', v => {
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
					return v
					
				})
				//console.log("Target Painted Air Raid specific parameters applied successfuly")
			}
			
			if(Stats[sName["Type"]] === "Auto Turret"){
				patch(template, 'Ammo_CustomParameter', v => {
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
					return v
				})
				//console.log("Turret specific parameters applied successfuly")
			}
			
			if(Stats[sName["Type"]] === "Napalm"){
				patch(template, 'Ammo_CustomParameter', v => {
					const napalmStats = v.find(node => node.name === 'EmitterParameter')
					//console.log("Napalm stats loaded...")
					const napalmHitCount = napalmStats.value.find(node => node.name === 'EmitterAmmoCount')
					//console.log("Hit count loaded...")
					const napalmHitInterval = napalmStats.value.find(node => node.name === 'EmitterInterval')
					//console.log("Hit Interval loaded")
					napalmHitCount.value = +Stats[sName["SecondaryShotCount"]]
					//console.log("Hit count assigned successfuly")
					napalmHitInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
					//console.log("Hit Interval assigned successfuly")
					return v
				})
			}
			
			if(Stats[sName["Type"]] === "Target Painter"){
				patch(template, 'Ammo_CustomParameter', v => {
					const lockSpeed = v[0]
					const lockRange = v[1]
					lockSpeed.value = +Stats[sName["SecondaryLockTime"]]
					lockRange.value = +Stats[sName["SecondaryLockRange"]]
					return v
				})
			}

			if(Stats[sName["Type"]] === "Lock On Launcher"){
				patch(template, 'Ammo_CustomParameter', v => {
					const misAcel = v[4]
					const misTurn = v[5]
					const misMaxSpeed = v[6]
					const misIgniteDelay = v[7].value[0]
					const misFlyStraight = v[8]
					//console.log("Lock On Triggered.  Base Values:", misAcel, misTurn, misMaxSpeed, misIgniteDelay, misFlyStraight )
					misAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
					misTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
					misMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
					misIgniteDelay.value = +Stats[sName["SecondaryEngineIgniteDelay"]]
					misFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]
					//console.log("Assigned Values:", misAcel, misTurn, misMaxSpeed, misFlyStraight )
					return v
				})
			}

			if(Stats[sName["Type"]] === "Homing Laser"){
				patch(template, 'Ammo_CustomParameter', v => {
					const laserAcel = v[3]
					const laserTurn = v[4]
					const laserMaxSpeed = v[5]
					const laserFlyStraight = v[6]
					//console.log("Lock On Triggered.  Base Values:", misAcel, misTurn, misMaxSpeed, misFlyStraight )
					laserAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
					laserTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
					laserMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
					laserFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]
					//console.log("Assigned Values:", misAcel, misTurn, misMaxSpeed, misFlyStraight )
					return v
				})
      }
      
      if(Stats[sName["Type"]] === "Energy Cluster"){
        patch(template, 'Ammo_CustomParameter', v => {
          const spreadAngle = v[2]
          const spreadType = v[3]
          const fireCount = v[5].value[2]
          const fireInterval = v[5].value[3]
          const ammoSpeed = v[5].value[5]
          const shotAoE = v[5].value[9]
          const ammoLifetime = v[5].value[10]

          spreadAngle.value = +Stats[sName["SecondarySpreadAngle"]]
          spreadType.value = +Stats[sName["SecondarySpreadTypeFlag"]]
          fireCount.value = +Stats[sName["SecondaryShotCount"]]
          fireInterval.value = Stats[sName["SecondaryProjectileInterval"]]-1
          ammoSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
          shotAoE.value = +Stats[sName["SecondaryShotAoE"]]
          ammoLifetime.value = +Stats[sName["SecondaryProjectileLifetime"]]
          return v
        })
      }

      if(Stats[sName["Type"]] === "CC Piercer"){
        patch(template, 'FireInterval', 1)
        patch(template, 'custom_parameter', v => {    

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
          return v
        })
      }

      if(Stats[sName["Type"]] === "Spine Driver"){
        patch(template, 'custom_parameter', v => {
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
        
          return v
        })
      }

      if(Stats[sName["Type"]] === "CC Striker"){
        patch(template, 'FireInterval', 1)
        patch(template, 'custom_parameter', v => {

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
          return v
        })
        
      }


			
			// if(Stats[sName["Type"]] === "Lightning"){
				// patch(template, 'Ammo_CustomParameter', v => {
					// const lightNoise = v[0].value
					// const lightRandVel = v[1].value
					// const lightCurve = v[2].value
					// const lightMod = v[3].value
					// lightNoise.value = 1
					// lightRandVel.value = 0
					// lightCurve.value = 0
					// lightMod.value = 1
					
				// })
			// }
			
			//TARGETED CHANGES END
			
			console.log(getId(meta),Stats[sName["NewName"]],"= Success")
			success++
		
    }
    //TRY END
		catch{
			console.log("WARNING: Stats for weapon with ID",getId(meta)," not found.  Skipping...")
			skipped++
		}
		//CATCH END
		

		
	})
	console.log("- - - - - - - - - -\nRebalance of",weaponByCat[targetCategory],"Complete\n")	
}

//Load Rebalance stats from spreadsheet
const statsRaw = fs.readFileSync('./rebalance spreadsheets/EDF Weapon Balance - Gun Rebalance.csv', 'utf8')
const parsedStats = Papa.parse(statsRaw)
const sName = getIndex(parsedStats)

//sprdSheetRebalance(20, parsedStats)

for(i = 0; i < 39; i++){
	if(weaponByCat[i] != null){
		sprdSheetRebalance(i, parsedStats)
	}
}

rebalance({category: 6, name: 'PX50 Bound Shot'}, (template, i, meta, text) => {
  // Remove recoil animation.
  patch(template, 'custom_parameter', value => {
    value[0].value = 'assault_recoil1'
    value[1].value = 1
    value[2].value = 0
    return value
  })
})

// Remove recoil animation from bombs (WIP)
rebalance({category: 34, id: 'Weapon656'}, (template, i, meta, text) => {
  patch(template, 'custom_parameter', v => {
    v[0].value = 'throw_recoil2'
    v[2].value = 0
    return v
  })
  patch(template, 'Ammo_CustomParameter', v => {
    v[5].value = 0.05
    return v
  })
})

rebalance({category: [36,37,38,39]}, (template, i, meta, text) => {
  // Double credit costs for all vehicles
  patch(template, 'ReloadTime', v => {
    const credit = v * 2
	//console.log('credit assigned correctly')
    replaceText(text,
      /Re-request: \d+/,
      `Re-request: ${credit}`
    )
    return credit
  })
})

rebalance({category: 36, name: /Titan/}, (template, i, meta, text) => {
  // Start more reloaded to make up for being weak compared to other forts.
  patch(template, 'ReloadInit', v => 1 - (1 - v) * 0.5)
  // Increase shot speed of Titan's Requiem Gun.
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const hardpointParameters = vehicleParameters.value[2]
    const mainCannon = hardpointParameters.value[0]
    const mainCannonConfig = mainCannon.value[0]

    const path = './SgottMods/weapon/v_404bigtank_mainCannon'
    mainCannonConfig.value = path + '.SGO'
    const mainCannonTemplate = require('./originals/V_404BIGTANK_MAINCANNON')
    patch(mainCannonTemplate, 'AmmoAlive', 240)
    patch(mainCannonTemplate, 'AmmoSpeed', 20)
    rawSgos.set(path.split(/\//).pop(), mainCannonTemplate)
    return values
  })

  // Increase durability for Titan
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 3
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 3}`
  )
})

rebalance({category: 36, name: /Gigantus|Melt/}, (template, i, meta, text) => {
  // Increase durability of all normal tanks
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 3
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 3}`
  )
})

rebalance({category: 36, name: /Armored Railgun/}, (template, i, meta, text) => {
  // Increase durability of all Armored Railguns
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 2
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 2}`
  )
})

rebalance({category: 37, name: /SDL1/}, (template, i, meta, text) => {
  // Increase grip and weight of all bikes
  patch(template, 'Ammo_CustomParameter', values => {
    const summonDelay = values[2]
    // Instant appearance
    summonDelay.value = 0
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const mobilityParameters = vehicleParameters.value[1]
    const grip = mobilityParameters.value[0]
    grip.value *= 3
    const weight = mobilityParameters.value[2]
    weight.value *= 1.5
    return values
  })
})

rebalance({category: 37, name: /SDL1/}, (template, i, meta, text) => {
  // Increase durability of all Bikes
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 2
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 2}`
  )
})

rebalance({category: 37, name: /Grape/}, (template, i, meta, text) => {
  // Add full rotation to grape's cannon
  const path = './SgottMods/weapon/vehicle401_striker'
  const vehicleTemplate = require('./originals/VEHICLE401_STRIKER.json')
  const cannonControl = getNode(vehicleTemplate, 'striker_cannon_ctrl')
  cannonControl.value[2].value = 60
  rawSgos.set(path.split(/\//).pop(), vehicleTemplate)

  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleConfig = summonParameters.value[2]
    vehicleConfig.value = path + '.SGO'
    return values
  })

  patch(template, 'resource', values => {
    const original = values.find(node => node.value === 'app:/Object/Vehicle401_Striker.sgo')
    if(!original) throw new Error('Original resource node not found!')
    original.value = path + '.SGO'
  })
})

rebalance({category: 37, name: /Grape/}, (template, i, meta, text) => {
  // Increase durability of all Grape models
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 4
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 4}`
  )
})

rebalance({category: 37, name: /Caravan/}, (template, i, meta, text) => {
  // Increase durability of all Caravan models
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 2
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 2}`
  )
})

rebalance({category: 37, name: /Naegling/}, (template, i, meta, text) => {
  // Increase durability of all Unarmored Ground Vehicle models
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 3
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 3}`
  )
})

rebalance({category: 38}, (template, i, meta, text) => {
  // Increase durability of all Helicopters
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 4
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 4}`
  )
})

rebalance({category: 39, name: /Depth Crawler/}, (template, i, meta, text) => {
  // Increase durability of all depth crawlers
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 5
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 5}`
  )
})

rebalance({category: 39, name:/Vegalta/}, (template, i, meta, text) => {
  // Increase durability of all Vegalta power suits
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 2.5
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 2.5}`
  )
})

rebalance({category: 39, name:/Proteus/}, (template, i, meta, text) => {
  // Increase durability of all Proteus power suits
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 1.5
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 1.5}`
  )
})

function json(obj) {
  return JSON.stringify(obj, null, 2)
}

const outDir = 'C:/Program Files (x86)/Steam/steamapps/common/Earth Defense Force 4.1/SgottTemplates/weapon'
//const outDir = './release/sgottstrap/SgottTemplates/weapon'
for(const [path, template] of rawSgos) {
  const filename = `${outDir}/${path}.json`
  //console.log(`Writing ${filename}` )
  fs.writeFileSync(filename, json(template))
}

for(const node of modded) {
  const id = getId(node)
  const path = `./originals/${id.toUpperCase()}`
  const template = require(path)
  const text = textTable.variables[0].value[table.variables[0].value.indexOf(node)]
  template.meta = {
    id: id,
	level: node.value[4].value * 25,
    description: text.value[3].value,
	after: template.meta.after,
	before: template.meta.before,
	category: template.meta.category,	
	unlockState: template.meta.unlockState,
  }
  
  const name = text.value[2]
    .value
    .replace(/\s+/g, '-')
    .replace(/[^0-9a-zA-Z-]/g, '')
  const filename = `${outDir}/${id}_${name}.json`
  //console.log(`Writing ${filename}` )
  fs.writeFileSync(filename, json(template))
}

console.log('\nRebalancing of',success,'weapons completed\nSkipped',skipped,'items.')