# Generated by Django 5.2 on 2025-05-04 11:11

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reimbursements', '0005_rename_receipt_number_applicationitem_position_number_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='applicationitem',
            name='budget_entry',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='reimbursements.budgetentry'),
        ),
    ]
