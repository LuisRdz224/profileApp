import { Component, OnInit } from '@angular/core';
import { APIService } from '../API.service';
import { User } from '../user';
import { Auth } from 'aws-amplify';
import { Router } from '@angular/router';
import { Storage } from '@aws-amplify/storage'; // Importar el módulo de almacenamiento de Amplify
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

export class ProfileComponent implements OnInit {
  selectedFile: File | null = null;
  userId?: string;
  userName?: string;
  user = new User('', '', '', '', '', '');
  showPhoto?: boolean;
  userCreated?: boolean;
  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement?.files?.length) {
      this.selectedFile = inputElement.files[0];
    }
  }
  constructor(private api: APIService, private router: Router) { }
  async uploadImage(): Promise<void> {
    if (this.selectedFile) {
      try {
        const path = `users/${this.userId}/${Date.now()}_${this.selectedFile.name}`;
        const result = await Storage.put(path, this.selectedFile, {
          level: "public",
          contentType: this.selectedFile.type,
        });
        this.user.imageUrl = result.key; // Almacena la URL de la imagen en this.user.imageUrl
        console.log("File uploaded successfully:", result);
        // Aquí puedes realizar cualquier acción adicional con el resultado
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    } else {
      console.warn("No file selected.");
    }
  }

  async ngOnInit() {
    this.showPhoto = false;
    this.user.imageUrl = ''
    Auth.currentAuthenticatedUser({
      bypassCache: false
    }).then(async user => {
      this.userName = user.username;
      this.userId = user.attributes.sub;
      let result = await this.api.GetUser(this.userId);
      if (!result) {
        this.userCreated = false;
        this.user = new User('', '', '', '', '', '');
      } else {
        console.log(result.image);
        this.userCreated = true;
        this.showPhoto = !!result.image;
        this.user = new User(
          this.userId,
          result.username,
          result.firstName,
          result.lastName,
          result.bio,
          result.image
        )
        // Recuperar la imagen del S3 en base a la URI (clave)
        const imageUrl = await Storage.get(result.image, { level: 'public' });
        console.log('URL pública de la imagen:', imageUrl);
        // Asignar la URL pública de la imagen para mostrarla en tu componente
        this.user.imageUrl = imageUrl;
      }
    })
      .catch(err => console.log(err));
  }

  editPhoto() {
    this.showPhoto = false;
  }
  async onImageUploaded(e: any) {
    this.user.imageUrl = e.key;
    if (this.userCreated) {
      await this.api.UpdateUser({
        id: this.userId,
        image: this.user.imageUrl
      });
    }
    this.showPhoto = true;
  }

  getType(): string {
    return this.userCreated ? 'UpdateUser' : 'CreateUser';
  }

  async updateProfile() {
    await this.uploadImage()
    const user = {
      id: this.userId,
      username: this.user.firstName + '_' + this.user.lastName,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      bio: this.user.aboutMe,
      image: this.user.imageUrl
    }
    console.log({ user });

    await this.api[this.getType()](user)
  }
  logout() {
    Auth.signOut({ global: true })
      .then(data => {
        this.router.navigate(['/auth'])
      })
      .catch(err => console.log(err))
  }
}