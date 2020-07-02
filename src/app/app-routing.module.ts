import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WhatsappComponent } from './components/whatsapp/whatsapp.component';
import { ConvListComponent } from './components/whatsapp/conv-list/conv-list.component';
import { ChatWindowComponent } from './components/whatsapp/chat-window/chat-window.component';
import { ListaClientesComponent } from './components/lista-clientes/lista-clientes.component';


const routes: Routes = [
  { path: '', redirectTo: '/app', pathMatch: 'full' },

  { path: 'app', component: ConvListComponent },
  { path: 'app/:id', component: ConvListComponent },

  { path: 'chat/:tkt', component: ChatWindowComponent },

  // zendeskInit
  { path: 'whatsapp/:zdUser', component: ConvListComponent },

  { path: 'clientes', component: ListaClientesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true, scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
