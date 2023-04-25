using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;
using Random = System.Random;

public class NewGameButton : MonoBehaviour
{
    public Button mButton;
    public GameObject activeScene;
    public GameObject deactivate;
    public float Liberal = 0;
    public float Libertarian = 0;
    public float Owners = 0;
    public float Workers = 0;
    public float Religious = 0;
    public float Immigrants = 0;
    public float CampaignBalance = 20000000f;
    public int availableStops = 20;
    public float p_rival1 = 10f;
    public float p_rival2 = 10f;
    public float p_rival3 = 10f;
    public float p_rival4 = 10f;
    public float rivalAdder = 15f;
    public float d_rival1 = 0;
    public float d_rival2 = 0;
    public float d_rival3 = 0;
    public float d_rival4 = 0;
    public float currentDelegates = 0;
    public int curPrimary = 0;
    public int generalDebates = 0;
    public int difficultyLevel;
    public int low = 1;
    public int high = 10;

    // Start is called before the first frame update
    void Start()
    {
        mButton.onClick.AddListener(onButtonClick);
        difficultyLevel = (int)Variables.Saved.Get("difficultyLevel");
        
    }

    // Update is called once per frame
    void onButtonClick()
    {
        Random rnd = new Random();
        PlayerPrefs.DeleteAll();
        difficultyLevel = (int)Variables.Saved.Get("difficultyLevel");
        Variables.Saved.Set("Liberal", Liberal);
        Variables.Saved.Set("Libertarian",Libertarian);
        Variables.Saved.Set("Owners",Owners);
        Variables.Saved.Set("Workers",Workers);
        Variables.Saved.Set("Religious",Religious);
        Variables.Saved.Set("Immigrants",Immigrants);
        Variables.Saved.Set("CampaignBalance",CampaignBalance/(1+difficultyLevel));
        Variables.Saved.Set("availableStops",availableStops/(1+difficultyLevel));
        Variables.Saved.Set("p_rival1",p_rival1*difficultyLevel+rivalAdder+rnd.Next(low, high));
        Variables.Saved.Set("p_rival2",p_rival2*difficultyLevel+rivalAdder+rnd.Next(low, high));
        Variables.Saved.Set("p_rival3",p_rival3*difficultyLevel+rivalAdder+rnd.Next(low, high));
        Variables.Saved.Set("p_rival4",p_rival4*difficultyLevel+rivalAdder+rnd.Next(low, high));
        Variables.Saved.Set("d_rival1",d_rival1);
        Variables.Saved.Set("d_rival2",d_rival2);
        Variables.Saved.Set("d_rival3",d_rival3);
        Variables.Saved.Set("d_rival4",d_rival4);
        Variables.Saved.Set("currentDelegates",currentDelegates);
        Variables.Saved.Set("curPrimary",curPrimary);
        Variables.Saved.Set("generalDebates",generalDebates);

        activeScene.SetActive(true);
        deactivate.SetActive(false);
    }
}
