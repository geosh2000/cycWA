import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.component.html',
  styleUrls: ['./lista-clientes.component.css']
})
export class ListaClientesComponent implements OnInit {

  usuariosActivosObs: Observable<any>

  constructor(
    public chat: ChatService
  ) { }

  ngOnInit() {
    this.usuariosActivosObs = this.chat.getUsuariosActivos();
  }

}
