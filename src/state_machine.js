class MaquinaEstados{

	constructor(_global_object){
		this._global_object = _global_object;
		this._estadoActual = null;
		this._estados = {};
	}

	lanzar = function(evento){
		if (evento in this._estados[this._estadoActual].eventoEstado){
			var accionEstado = this._estados[this._estadoActual].eventoEstado[evento];

			accionEstado.ejecutar(this._global_object);
			
			var siguienteEstado = accionEstado.obtenerEstado();

			if(siguienteEstado!=null){
				this._estados[this._estadoActual].ejecutarAlSalir(this._global_object);
				this._estadoActual = siguienteEstado;
				this._estados[this._estadoActual].ejecutarAlEntrar(this._global_object);
			}
			console.log("Nuevo estado: "+this._estadoActual)
		}
	} 
	en = function(estado){
		return new CuandoEjecutarBuilder(estado,this._estados);
	}
	inicio = function(estado){
		this._estadoActual = estado;
	}

}

class MachineBuilder{
	constructor(estados){
		this._estados = estados;
		this.estadoOrigen = null; //string
		this.evento = null; //string
		this.estadoDestino = null; //string...
		this.ejecutarTransicion = null;
	}
	Build = function(){
		if (!(this.estadoOrigen in this._estados)){ 
			this._estados[this.estadoOrigen] = new Estado(this.estadoOrigen);
		}
		this._estados[this.estadoOrigen].eventoEstado[this.evento] = new AccionEstado(this.estadoDestino,this.ejecutarTransicion);
	}
}
class EntrarSalirBuilder{
	constructor(estados){
		this._estados = estados;
		this.estadoOrigen = null;
		this.ejecutarEntrar = null;
		this.ejecutarSalir = null;
	}
	Build = function(){
		if (!(this.estadoOrigen in this._estados)){ 
			this._estados[this.estadoOrigen] = new Estado(this.estadoOrigen);
		}
		if(this.ejecutarSalir!=null){
			this._estados[this.estadoOrigen].ejecutarSalir = this.ejecutarSalir;	
		}
		if(this.ejecutarEntrar!=null){
			this._estados[this.estadoOrigen].ejecutarEntrar = this.ejecutarEntrar;	
		}
	}
}


class CuandoEjecutarBuilder{
	constructor(estado,estados){
		this._estados = estados;
		this.estado = estado;
		this.eventoEstado = {};
	}
	cuando = function(evento){
		var mb = new MachineBuilder(this._estados);
		mb.estadoOrigen = this.estado;
		var e = new IrOEjecutarBuilder(evento,mb);
		return e;
	}
	ejecutar = function(){
		var esb = new EntrarSalirBuilder(this._estados); 
		esb.estadoOrigen = this.estado;
		var e = new EntrarOSalir(esb);
		return e;
	}
}
class EntrarOSalir{
	constructor(esb){
		this.esb = esb;
	}
	alEntrar = function(accion){
		this.esb.ejecutarEntrar = accion
		this.esb.Build();
		return new Salir(this.esb)
	}
	alSalir = function(accion){
		this.esb.ejecutarSalir = accion
		this.esb.Build();
		return new Entrar(this.esb)
	}
}
class Entrar{
	constructor(esb){
		this.esb = esb;
	}
	alSalir = function(accion){
		this.esb.ejecutarSalir = accion;
		this.esb.Build();
	}
}

class Salir{
	constructor(esb){
		this.esb = esb;
	}
	alEntrar = function(accion){
		this.esb.ejecutarEntrar = accion;
		this.esb.Build();
	}
}

class IrOEjecutarBuilder{
	constructor(evento,mb){
		this._mb = mb
		this.evento = evento;
	}
	//podemos llamarle ejecutar, y que quede aquí, o sea puede que lleguén eventos y solo querramos que algo pasé, pero no que transicione
	ejecutar = function(accion){
		this._mb.ejecutarTransicion = accion;
		
		this._mb.evento = this.evento;
		this._mb.Build();

		var e = new IrABuilder(this.evento,this._mb);
		return e;
	}
	irA = function(estado){
		this._mb.evento = this.evento;
		this._mb.estadoDestino = estado;
		this._mb.Build();
	}
}

class IrABuilder{
	constructor(evento,mb){
		this._mb = mb;
		this.evento = evento;
	}
	irA = function(estado){
		this._mb.evento = this.evento;
		this._mb.estadoDestino = estado;
		this._mb.Build();
	}
}

class AccionEstado{
	constructor(estado,accion){
		this._Estado = estado;
		this._Accion = accion;
	}
	ejecutar(params){
		if (this._Accion!=null)
			this._Accion(params);
	}
	obtenerEstado(){
		return this._Estado;
	}
}

class Estado{
	constructor(estado){
		this.ejecutarEntrar = null;
		this.ejecutarSalir = null;
		this.estado = estado;
		this.eventoEstado = {};
	}
	ejecutarAlEntrar(params){
		if(this.ejecutarEntrar != null){
			this.ejecutarEntrar(params)
		}
	}
	ejecutarAlSalir(params){
		if(this.ejecutarSalir != null){
			this.ejecutarSalir(params)
		}
	}
}

class evento{

	constructor(evento,ejecutarTransicion){
		this.ejecutarTransicion = ejecutarTransicion;
		this.evento = evento;
	}
}
