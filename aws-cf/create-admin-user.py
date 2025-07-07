from airflow.auth.managers.fab.models import User, Role
from airflow.auth.managers.fab.fab_security_manager import FabSecurityManager
from airflow.utils.session import provide_session

@provide_session
def create_user(session=None):
    sm = FabSecurityManager()
    existing_user = session.query(User).filter_by(username='admin').first()
    if existing_user:
        print("User 'admin' already exists")
        return

    role = session.query(Role).filter_by(name='Admin').first()
    if not role:
        role = sm.add_role('Admin')

    user = User(
        username='admin',
        email='admin@example.com',
        first_name='Admin',
        last_name='User',
        _password='admin',  # Will be hashed automatically
        roles=[role],
        active=True,
    )

    session.add(user)
    session.commit()
    print("✅ Created admin user: admin/admin")

create_user()
